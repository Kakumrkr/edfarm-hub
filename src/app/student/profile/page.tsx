import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ProfileForm } from "./profile-form";

const RESUME_MSG: Record<string, { ok: boolean; text: string }> = {
  uploaded: { ok: true, text: "Resume uploaded." },
  missing: { ok: false, text: "Choose a PDF file first." },
  toobig: { ok: false, text: "That file is over 2 MB." },
  notpdf: { ok: false, text: "Only PDF files are accepted." },
  error: { ok: false, text: "Upload failed. Try again." },
};

export default async function StudentProfilePage({ searchParams }: PageProps<"/student/profile">) {
  const user = await requireUser(["STUDENT"]);
  if (!user.student) notFound();
  const { resume } = await searchParams;
  const msg = typeof resume === "string" ? RESUME_MSG[resume] : undefined;

  const student = await prisma.student.findUnique({
    where: { id: user.student.id },
    select: {
      id: true,
      cohort: true,
      skills: true,
      bio: true,
      resumeName: true,
      resumeUpdatedAt: true,
      achievements: { orderBy: { awardedAt: "desc" }, select: { id: true, title: true, detail: true } },
    },
  });
  if (!student) notFound();

  return (
    <>
      <PageHeader
        title="My profile"
        description="Organizations see this when you apply. Your email and resume are never public."
        actions={
          <ButtonLink href={`/s/${student.id}`} variant="secondary">
            <ExternalLink className="size-4" aria-hidden /> View my public profile
          </ButtonLink>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardTitle className="mb-4">About you</CardTitle>
          <ProfileForm cohort={student.cohort} skills={student.skills} bio={student.bio} />
        </Card>

        <div className="space-y-6">
          <Card id="resume">
            <CardTitle className="mb-1">Resume</CardTitle>
            <p className="mb-4 text-sm text-stone-500">PDF only, up to 2 MB. Required to apply.</p>
            {student.resumeName ? (
              <a
                href={`/api/resume/${student.id}`}
                target="_blank"
                rel="noreferrer"
                className="mb-4 flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm hover:bg-stone-100"
              >
                <FileText className="size-4 shrink-0 text-emerald-700" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">{student.resumeName}</span>
                <span className="shrink-0 text-xs text-stone-500">{formatDate(student.resumeUpdatedAt)}</span>
              </a>
            ) : (
              <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No resume yet. Upload one to start applying.
              </p>
            )}
            {msg && (
              <p
                role={msg.ok ? undefined : "alert"}
                className={`mb-3 rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}
              >
                {msg.text}
              </p>
            )}
            <form action="/api/resume" method="post" encType="multipart/form-data" className="space-y-3">
              <input
                type="file"
                name="resume"
                accept="application/pdf,.pdf"
                required
                aria-label="Resume PDF"
                className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-stone-800 hover:file:bg-stone-200"
              />
              <button type="submit" className={buttonClass()}>
                {student.resumeName ? "Replace resume" : "Upload resume"}
              </button>
            </form>
          </Card>

          <Card>
            <CardTitle className="mb-3">Verified achievements</CardTitle>
            {student.achievements.length === 0 ? (
              <p className="text-sm text-stone-500">Ed Farm staff add achievements as you complete programs.</p>
            ) : (
              <ul className="space-y-3">
                {student.achievements.map((a) => (
                  <li key={a.id}>
                    <p className="text-sm font-medium text-stone-900">{a.title}</p>
                    {a.detail && <p className="text-xs text-stone-500">{a.detail}</p>}
                    <VerifiedBadge className="mt-1" />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
