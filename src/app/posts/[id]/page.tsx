import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileText, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, ORG_TYPES, type Category, type OrgType } from "@/lib/constants";
import { csvToList, formatDate } from "@/lib/format";
import { countSeats } from "@/server/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ButtonLink } from "@/components/ui/button";
import { ApplyForm } from "./apply-form";

export default async function PostPage({ params }: PageProps<"/posts/[id]">) {
  const user = await requireUser(["STUDENT"]);
  const { id } = await params;
  const me = user.student?.id ?? "";

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      org: { select: { name: true, type: true, status: true, description: true } },
      applications: { select: { id: true, status: true, studentId: true, teammateId: true } },
    },
  });
  // R1: posts of non-approved orgs are hidden from students.
  if (!post || post.org.status !== "APPROVED") notFound();

  const mine = post.applications.find((a) => a.studentId === me || a.teammateId === me);
  if (post.status !== "OPEN" && !mine) notFound();

  const student = await prisma.student.findUnique({ where: { id: me }, select: { resumeName: true } });
  const seatsLeft = Math.max(0, post.positions - countSeats(post.applications));
  const skills = csvToList(post.skills);

  return (
    <>
      <Link href="/posts" className="mb-4 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ArrowLeft className="size-4" aria-hidden /> All projects
      </Link>
      <PageHeader
        title={post.title}
        description={`${CATEGORIES[post.category as Category] ?? post.category} · posted ${formatDate(post.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            <StatusBadge kind="comp" status={post.compensationType} />
            {post.beginnerFriendly && <Badge tone="sky">Beginner-friendly</Badge>}
            {post.status !== "OPEN" && <StatusBadge kind="post" status={post.status} />}
          </div>
          <p className="whitespace-pre-line text-stone-700">{post.description}</p>
          <dl className="mt-5 grid gap-4 border-t border-stone-100 pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-stone-500">Compensation</dt>
              <dd className="font-medium">{post.compensationNote || "Volunteer"}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Seats left</dt>
              <dd className="inline-flex items-center gap-1 font-medium">
                <Users className="size-4 text-stone-400" aria-hidden /> {seatsLeft} of {post.positions}
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
          <div className="mt-6 border-t border-stone-100 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-stone-900">{post.org.name}</p>
              <VerifiedBadge label="Approved by Ed Farm" />
              <span className="text-sm text-stone-500">{ORG_TYPES[post.org.type as OrgType] ?? post.org.type}</span>
            </div>
            <p className="mt-1 text-sm text-stone-500">{post.org.description}</p>
          </div>
        </Card>

        <Card className="h-fit">
          {mine ? (
            <>
              <CardTitle className="mb-2">Your application</CardTitle>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge kind="app" status={mine.status} />
                <Badge>{mine.studentId === me ? "Lead" : "Teammate"}</Badge>
              </div>
              <ButtonLink href="/student" variant="secondary" size="sm">
                Go to My work
              </ButtonLink>
            </>
          ) : !student?.resumeName ? (
            <>
              <CardTitle className="mb-2">Apply</CardTitle>
              <p className="mb-4 text-sm text-stone-500">Upload a resume (PDF) before you apply.</p>
              <ButtonLink href="/student/profile#resume">
                <FileText className="size-4" aria-hidden /> Upload resume first
              </ButtonLink>
            </>
          ) : (
            <>
              <CardTitle className="mb-4">Apply</CardTitle>
              <ApplyForm postId={post.id} seatsLeft={seatsLeft} />
            </>
          )}
        </Card>
      </div>
    </>
  );
}
