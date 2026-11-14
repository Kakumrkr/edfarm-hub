import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/constants";
import { csvToList, formatDate } from "@/lib/format";
import { countSeats } from "@/server/queries";
import { closePost } from "@/server/actions/org";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function OrgPostPage({ params }: PageProps<"/org/posts/[id]">) {
  const user = await requireUser(["ORG"]);
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    include: { applications: { select: { status: true, teammateId: true } } },
  });
  // Ownership: only the org that owns the post.
  if (!post || !user.org || post.orgId !== user.org.id) notFound();
  const seats = countSeats(post.applications);
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

      <section>
        <CardTitle className="mb-3">Applicants</CardTitle>
        <EmptyState icon={Users} title="Applicants will show here">
          Ed Farm learners who apply, with their verified achievements and resumes.
        </EmptyState>
      </section>
    </>
  );
}
