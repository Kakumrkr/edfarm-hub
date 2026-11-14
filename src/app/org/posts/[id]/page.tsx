import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Hammer, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, CONTACT_LINE, type Category } from "@/lib/constants";
import { csvToList, formatDate } from "@/lib/format";
import { countSeats, getStudentStats, memberSelect } from "@/server/queries";
import { accept, decline } from "@/server/actions/application";
import { MemberRow, type Member } from "@/components/applicant-card";
import { closePost } from "@/server/actions/org";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Stars } from "@/components/ui/stars";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { CompleteForm } from "@/components/work-forms";

export default async function OrgPostPage({ params }: PageProps<"/org/posts/[id]">) {
  const user = await requireUser(["ORG"]);
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      applications: {
        where: { status: { in: ["APPLIED", "IN_PROGRESS", "COMPLETED"] } },
        orderBy: { createdAt: "asc" },
        include: { student: { select: memberSelect }, teammate: { select: memberSelect } },
      },
    },
  });
  // Ownership: only the org that owns the post.
  if (!post || !user.org || post.orgId !== user.org.id) notFound();
  const seatApps = await prisma.application.findMany({
    where: { postId: post.id, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    select: { status: true, teammateId: true },
  });
  const seats = countSeats(seatApps);
  const seatsLeft = post.positions - seats;

  // Attach stats to every member shown.
  const withStats = async (s: Omit<Member, "stats">): Promise<Member> => ({ ...s, stats: await getStudentStats(s.id) });
  const apps = await Promise.all(
    post.applications.map(async (a) => ({
      ...a,
      lead: await withStats(a.student),
      mate: a.teammate ? await withStats(a.teammate) : null,
    })),
  );
  const applied = apps.filter((a) => a.status === "APPLIED");
  const inProgress = apps.filter((a) => a.status === "IN_PROGRESS");
  const completed = apps.filter((a) => a.status === "COMPLETED");
  const skills = csvToList(post.skills);

  return (
    <>
      <Link href="/org" className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="size-4" aria-hidden /> My projects
      </Link>
      <PageHeader
        title={post.title}
        description={`${CATEGORIES[post.category as Category] ?? post.category} · posted ${formatDate(post.createdAt)}`}
        actions={
          post.status !== "CLOSED" && (
            <form action={closePost.bind(null, post.id)}>
              <SubmitButton variant="secondary" pendingText="Closing">
                Close post
              </SubmitButton>
            </form>
          )
        }
      />

      <Card className="mb-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <StatusBadge kind="post" status={post.status} />
          <StatusBadge kind="comp" status={post.compensationType} />
          {post.beginnerFriendly && <Badge tone="sky">Beginner-friendly</Badge>}
          {post.aiDrafted && <Badge>AI-drafted</Badge>}
        </div>
        <p className="whitespace-pre-line text-stone-700">{post.description}</p>
        <dl className="mt-5 grid gap-4 border-t border-stone-100 pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-stone-500">Compensation</dt>
            <dd className="font-medium">{post.compensationNote || "Volunteer"}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Seats used</dt>
            <dd className="inline-flex items-center gap-1 font-medium">
              <Users className="size-4 text-stone-400" aria-hidden /> {seats}/{post.positions}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Estimated time</dt>
            <dd className="inline-flex items-center gap-1 font-medium">
              <Clock className="size-4 text-stone-400" aria-hidden />
              {post.estimatedHours ? `${post.estimatedHours} hours` : "Not set"}
            </dd>
          </div>
        </dl>
        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        )}
      </Card>

      <section className="mb-8">
        <CardTitle className="mb-3">Applicants ({applied.length})</CardTitle>
        {applied.length === 0 ? (
          <EmptyState icon={Users} title="No applicants right now">
            Ed Farm learners who apply show here, with their verified achievements and resumes.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {applied.map((a) => {
              const size = a.mate ? 2 : 1;
              const fits = post.status === "OPEN" && size <= seatsLeft;
              return (
                <li key={a.id}>
                  <Card>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {a.mate ? <Badge tone="violet">Team of 2</Badge> : <Badge>Solo</Badge>}
                      <span className="text-sm text-stone-500">
                        Needs {size} seat{size > 1 ? "s" : ""} · applied {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <div className="space-y-5">
                      <MemberRow m={a.lead} role={a.mate ? "Lead" : undefined} showEmail={false} />
                      {a.mate && <MemberRow m={a.mate} role="Teammate" showEmail={false} />}
                    </div>
                    {a.note && (
                      <blockquote className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-sm whitespace-pre-line text-stone-700">
                        {a.note}
                      </blockquote>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
                      {fits ? (
                        <form action={accept.bind(null, a.id)}>
                          <SubmitButton pendingText="Accepting">Accept</SubmitButton>
                        </form>
                      ) : (
                        <p className="text-sm text-stone-500">
                          {post.status === "OPEN" ? `Not enough seats left (${seatsLeft}).` : "Post is not open."}
                        </p>
                      )}
                      <form action={decline.bind(null, a.id)}>
                        <SubmitButton variant="secondary" pendingText="Declining">
                          Decline
                        </SubmitButton>
                      </form>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <CardTitle className="mb-1">In progress ({inProgress.length})</CardTitle>
        <p className="mb-3 text-sm text-stone-500">{CONTACT_LINE}</p>
        {inProgress.length === 0 ? (
          <EmptyState icon={Hammer} title="No work in progress">
            Accepted students show here with their email so you can get started.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {inProgress.map((a) => (
              <li key={a.id}>
                <Card>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <StatusBadge kind="app" status={a.status} />
                    {a.mate && <Badge tone="violet">Team of 2</Badge>}
                    <span className="text-sm text-stone-500">accepted {formatDate(a.acceptedAt)}</span>
                    {a.doneRequestedAt && <Badge tone="emerald">Students say done</Badge>}
                  </div>
                  <div className="space-y-5">
                    <MemberRow m={a.lead} role={a.mate ? "Lead" : undefined} showEmail />
                    {a.mate && <MemberRow m={a.mate} role="Teammate" showEmail />}
                  </div>
                  {a.doneRequestedAt && (
                    <div className="mt-5 rounded-xl bg-emerald-50/60 px-4 py-3 text-sm">
                      <p className="font-medium text-stone-900">Marked done on {formatDate(a.doneRequestedAt)}</p>
                      {a.studentSummary && (
                        <p className="mt-1 whitespace-pre-line text-stone-700">{a.studentSummary}</p>
                      )}
                    </div>
                  )}
                  <div className="mt-5 border-t border-stone-100 pt-4">
                    <CardTitle className="mb-1 text-base">Mark completed</CardTitle>
                    <p className="mb-3 text-sm text-stone-500">
                      Confirms the work on each member&apos;s public profile. You can do this even if they haven&apos;t
                      marked done.
                    </p>
                    <CompleteForm appId={a.id} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <CardTitle className="mb-3">Completed ({completed.length})</CardTitle>
        {completed.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing completed yet">
            Finished work shows here and on each member&apos;s public profile.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {completed.map((a) => (
              <li key={a.id}>
                <Card>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <VerifiedBadge label="Completed" />
                    <span className="text-sm text-stone-500">{formatDate(a.completedAt)}</span>
                    {a.rating != null && <Stars value={a.rating} />}
                  </div>
                  <p className="font-medium text-stone-900">
                    <Link href={`/s/${a.lead.id}`} className="hover:text-emerald-800">
                      {a.lead.user.name}
                    </Link>
                    {a.mate && (
                      <>
                        {" and "}
                        <Link href={`/s/${a.mate.id}`} className="hover:text-emerald-800">
                          {a.mate.user.name}
                        </Link>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">{CONTACT_LINE}</p>
                  <p className="mt-1 text-sm">
                    <a href={`mailto:${a.lead.user.email}`} className="text-emerald-700 hover:text-emerald-800">
                      {a.lead.user.email}
                    </a>
                    {a.mate && (
                      <>
                        {", "}
                        <a href={`mailto:${a.mate.user.email}`} className="text-emerald-700 hover:text-emerald-800">
                          {a.mate.user.email}
                        </a>
                      </>
                    )}
                  </p>
                  {a.review && <p className="mt-3 text-sm whitespace-pre-line text-stone-700">“{a.review}”</p>}
                  {a.reviewHidden && <p className="mt-1 text-xs text-stone-500">Review hidden by Ed Farm.</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
