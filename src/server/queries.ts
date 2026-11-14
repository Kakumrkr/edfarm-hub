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

/**
 * Public trust profile (R16): no email, no resume, no DECLINED/WITHDRAWN/CANCELLED.
 * Merges applications where the student is lead or teammate. Hidden reviews are stripped (R13).
 */
export async function getPublicProfile(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      bio: true,
      skills: true,
      cohort: true,
      user: { select: { name: true } },
      achievements: {
        orderBy: { awardedAt: "desc" },
        select: { id: true, title: true, detail: true, awardedAt: true },
      },
    },
  });
  if (!student) return null;

  const person = { select: { id: true, user: { select: { name: true } } } };
  const apps = await prisma.application.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "COMPLETED"] },
      OR: [{ studentId }, { teammateId: studentId }],
    },
    orderBy: [{ completedAt: "desc" }, { acceptedAt: "desc" }],
    select: {
      id: true,
      status: true,
      acceptedAt: true,
      completedAt: true,
      completedBy: true,
      rating: true,
      review: true,
      reviewHidden: true,
      studentSummary: true,
      studentId: true,
      student: person,
      teammate: person,
      post: { select: { title: true, category: true, org: { select: { name: true, type: true } } } },
    },
  });

  const items = apps.map(({ review, reviewHidden, rating, student: lead, teammate, ...a }) => {
    const partner = a.studentId === studentId ? teammate : lead;
    return {
      ...a,
      rating: reviewHidden ? null : rating,
      review: reviewHidden ? null : review,
      partner: partner ? { id: partner.id, name: partner.user.name } : null,
    };
  });

  return {
    student,
    current: items.filter((i) => i.status === "IN_PROGRESS"),
    completed: items.filter((i) => i.status === "COMPLETED"),
    stats: await getStudentStats(studentId),
  };
}

export async function getLandingStats() {
  const [orgs, completed, students, latest] = await Promise.all([
    prisma.org.count({ where: { status: "APPROVED" } }),
    prisma.application.count({ where: { status: "COMPLETED" } }),
    prisma.student.count(),
    prisma.application.findFirst({
      where: { status: "COMPLETED", completedBy: "ORG", reviewHidden: false, review: { not: null } },
      orderBy: { completedAt: "desc" },
      select: {
        rating: true,
        review: true,
        completedAt: true,
        teammateId: true,
        student: { select: { id: true, user: { select: { name: true } } } },
        teammate: { select: { user: { select: { name: true } } } },
        post: { select: { title: true, org: { select: { name: true, type: true, contactName: true } } } },
      },
    }),
  ]);
  return { orgs, completed, students, latest };
}
