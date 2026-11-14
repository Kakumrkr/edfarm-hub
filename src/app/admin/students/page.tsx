import Link from "next/link";
import { ExternalLink, GraduationCap, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { addAchievement, removeAchievement } from "@/server/actions/admin-students";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

export default async function AdminStudentsPage() {
  await requireUser(["ADMIN"]);
  const students = await prisma.student.findMany({
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      cohort: true,
      user: { select: { name: true } },
      achievements: { orderBy: { awardedAt: "desc" }, select: { id: true, title: true, detail: true, awardedAt: true } },
      _count: {
        select: {
          applications: { where: { status: "COMPLETED" } },
          teamApplications: { where: { status: "COMPLETED" } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Students"
        description="Add verified Ed Farm achievements. They show on each student's public profile."
      />

      {students.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No students yet">
          Students appear here once they sign up.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {students.map((s) => {
            const completed = s._count.applications + s._count.teamApplications;
            return (
              <li key={s.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <InitialsAvatar name={s.user.name} />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold tracking-tight">{s.user.name}</p>
                        <p className="text-sm text-stone-500">{s.cohort || "No cohort"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="emerald">{completed} completed</Badge>
                      <Link
                        href={`/s/${s.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                      >
                        Public profile <ExternalLink className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-stone-100 pt-4">
                    <h2 className="mb-2 text-sm font-medium text-stone-700">Achievements</h2>
                    {s.achievements.length === 0 ? (
                      <p className="text-sm text-stone-500">No achievements yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {s.achievements.map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-stone-200 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="flex flex-wrap items-center gap-2 font-medium">
                                {a.title} <VerifiedBadge />
                              </p>
                              {a.detail && <p className="text-sm text-stone-700">{a.detail}</p>}
                              <p className="text-xs text-stone-500">Awarded {formatDate(a.awardedAt)}</p>
                            </div>
                            <form action={removeAchievement.bind(null, a.id)}>
                              <SubmitButton size="sm" variant="secondary" pendingText="Removing">
                                <Trash2 className="size-3.5" aria-hidden /> Remove
                              </SubmitButton>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <form
                    action={addAchievement.bind(null, s.id)}
                    className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <Input
                      name="title"
                      required
                      minLength={2}
                      maxLength={80}
                      placeholder="Achievement title"
                      aria-label="Achievement title"
                      className="h-8 sm:flex-1"
                    />
                    <Input
                      name="detail"
                      maxLength={200}
                      placeholder="Detail (optional)"
                      aria-label="Achievement detail"
                      className="h-8 sm:flex-[2]"
                    />
                    <SubmitButton size="sm" pendingText="Adding">
                      Add achievement
                    </SubmitButton>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
