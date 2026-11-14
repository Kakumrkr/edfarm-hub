import { prisma } from "@/lib/db";

type SeatApp = { status: string; teammateId: string | null };

/** R7: IN_PROGRESS + COMPLETED applications, counting 2 for teams. */
export function countSeats(apps: SeatApp[]): number {
  return apps
    .filter((a) => a.status === "IN_PROGRESS" || a.status === "COMPLETED")
    .reduce((n, a) => n + (a.teammateId ? 2 : 1), 0);
}

export async function seatsUsed(postId: string): Promise<number> {
  const apps = await prisma.application.findMany({
    where: { postId, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
    select: { status: true, teammateId: true },
  });
  return countSeats(apps);
}

export async function getOrgDashboard(orgId: string) {
  const posts = await prisma.post.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    include: { applications: { select: { status: true, teammateId: true } } },
  });
  return posts.map((p) => ({
    ...p,
    applicants: p.applications.filter((a) => a.status === "APPLIED").length,
    inProgress: p.applications.filter((a) => a.status === "IN_PROGRESS").length,
    completed: p.applications.filter((a) => a.status === "COMPLETED").length,
    seats: countSeats(p.applications),
  }));
}

/** Completed count, avg visible rating (R13), distinct orgs. Counts lead + teammate applications. */
export async function getStudentStats(studentId: string) {
  const apps = await prisma.application.findMany({
    where: { status: "COMPLETED", OR: [{ studentId }, { teammateId: studentId }] },
    select: { rating: true, reviewHidden: true, post: { select: { orgId: true } } },
  });
  const ratings = apps.filter((a) => a.rating != null && !a.reviewHidden).map((a) => a.rating!);
  return {
    completed: apps.length,
    avgRating: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null,
    orgs: new Set(apps.map((a) => a.post.orgId)).size,
  };
}

/** Fields an org sees about an applicant. Email is selected but only rendered per R8. */
export const memberSelect = {
  id: true,
  cohort: true,
  skills: true,
  resumeName: true,
  user: { select: { name: true, email: true } },
  achievements: { select: { id: true, title: true }, orderBy: { awardedAt: "desc" as const } },
} as const;
