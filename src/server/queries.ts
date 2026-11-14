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
