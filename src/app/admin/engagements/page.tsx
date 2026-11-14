import { CheckCircle2, Clock, EyeOff, Handshake, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { adminCancel, adminComplete, setReviewHidden } from "@/server/actions/admin-engagements";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { SubmitButton } from "@/components/ui/submit-button";

const DAY = 24 * 60 * 60 * 1000;

const include = {
  post: { select: { id: true, title: true, org: { select: { name: true } } } },
  student: { select: { id: true, user: { select: { name: true } } } },
  teammate: { select: { id: true, user: { select: { name: true } } } },
} as const;

function Students({ lead, teammate }: { lead: string; teammate?: string | null }) {
  return (
    <p className="text-sm text-stone-700">
      {lead}
      {teammate ? ` and ${teammate}` : ""}
      {teammate && (
        <Badge tone="sky" className="ml-2">
          Team of 2
        </Badge>
      )}
    </p>
  );
}

export default async function AdminEngagementsPage() {
  await requireUser(["ADMIN"]);
  const [active, completed] = await Promise.all([
    prisma.application.findMany({ where: { status: "IN_PROGRESS" }, include }),
    prisma.application.findMany({
      where: { status: "COMPLETED" },
      include,
      orderBy: { completedAt: "desc" },
    }),
  ]);
  active.sort((a, b) => {
    if (!!a.doneRequestedAt !== !!b.doneRequestedAt) return a.doneRequestedAt ? -1 : 1;
    return (a.acceptedAt?.getTime() ?? 0) - (b.acceptedAt?.getTime() ?? 0);
  });
  const now = Date.now();

  return (
    <>
      <PageHeader
        title="Engagements"
        description="Projects in progress and finished work. Close stalled projects and moderate reviews."
      />

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          In progress <Badge tone="amber">{active.length}</Badge>
        </h2>
        {active.length === 0 ? (
          <EmptyState icon={Handshake} title="Nothing in progress">
            No students are working on a project right now.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {active.map((a) => {
              const days = a.acceptedAt ? Math.max(0, Math.floor((now - a.acceptedAt.getTime()) / DAY)) : null;
              return (
                <li key={a.id}>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-stone-500">{a.post.org.name}</p>
                        <p className="text-lg font-semibold tracking-tight">{a.post.title}</p>
                      </div>
                      {days !== null && (
                        <Badge tone="stone">
                          <Clock className="size-3.5" aria-hidden />
                          {days === 1 ? "1 day" : `${days} days`} since accepted
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <Students lead={a.student.user.name} teammate={a.teammate?.user.name} />
                    </div>
                    {a.doneRequestedAt && (
                      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm ring-1 ring-amber-200 ring-inset">
                        <p className="font-medium text-amber-800">Students marked done {formatDate(a.doneRequestedAt)}</p>
                        {a.studentSummary && <p className="mt-1 whitespace-pre-line text-stone-700">{a.studentSummary}</p>}
                      </div>
                    )}
                    <div className="mt-5 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
                      <form action={adminComplete.bind(null, a.id)}>
                        <SubmitButton size="sm" pendingText="Completing">
                          <ShieldCheck className="size-4" aria-hidden /> Mark completed (Ed Farm verified)
                        </SubmitButton>
                      </form>
                      <form action={adminCancel.bind(null, a.id)}>
                        <SubmitButton size="sm" variant="danger" pendingText="Cancelling">
                          Cancel
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
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          Completed <Badge tone="emerald">{completed.length}</Badge>
        </h2>
        {completed.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No completed projects yet">
            Finished work shows up here once an org or Ed Farm closes it.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {completed.map((a) => (
              <li key={a.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-stone-500">{a.post.org.name}</p>
                      <p className="text-lg font-semibold tracking-tight">{a.post.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {a.completedBy === "ADMIN" && (
                        <Badge tone="emerald">
                          <ShieldCheck className="size-3.5" aria-hidden /> Closed by Ed Farm
                        </Badge>
                      )}
                      {a.reviewHidden && (
                        <Badge tone="stone">
                          <EyeOff className="size-3.5" aria-hidden /> Hidden
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Students lead={a.student.user.name} teammate={a.teammate?.user.name} />
                  </div>
                  <p className="mt-1 text-sm text-stone-500">Completed {formatDate(a.completedAt)}</p>
                  {a.rating && <Stars value={a.rating} className="mt-3" />}
                  {a.review ? (
                    <blockquote
                      className={`mt-2 border-l-2 border-stone-200 pl-3 text-sm ${a.reviewHidden ? "text-stone-400" : "text-stone-700"}`}
                    >
                      {a.review}
                    </blockquote>
                  ) : (
                    <p className="mt-2 text-sm text-stone-500">No review left.</p>
                  )}
                  {a.review && (
                    <div className="mt-5 border-t border-stone-100 pt-4">
                      <form action={setReviewHidden.bind(null, a.id, !a.reviewHidden)}>
                        <SubmitButton size="sm" variant="secondary" pendingText="Saving">
                          {a.reviewHidden ? "Unhide" : "Hide review"}
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
