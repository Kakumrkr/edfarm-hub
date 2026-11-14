"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { countSeats } from "@/server/queries";
import type { FormState } from "./auth";

const idSchema = z.string().min(1).max(64);

const applySchema = z.object({
  note: z.string().trim().max(500, "Note: 500 characters max.").default(""),
  teammateEmail: z.union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid teammate email.")]).default(""),
});

function onPost(postId: string, studentId: string) {
  return prisma.application.findFirst({
    where: { postId, OR: [{ studentId }, { teammateId: studentId }] },
    select: { id: true },
  });
}

function refresh(postId: string) {
  revalidatePath("/student");
  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/org");
  revalidatePath(`/org/posts/${postId}`);
}

/** R5 + R6. */
export async function apply(postId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const pid = idSchema.safeParse(postId);
  if (!pid.success || !user.student) return { ok: false, error: "Project not found." };
  const parsed = applySchema.safeParse({
    note: formData.get("note") ?? "",
    teammateEmail: String(formData.get("teammateEmail") ?? "").trim(),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { note, teammateEmail } = parsed.data;

  const me = await prisma.student.findUnique({
    where: { id: user.student.id },
    select: { id: true, resumeUpdatedAt: true, resumeName: true },
  });
  if (!me?.resumeName) return { ok: false, error: "Upload your resume on your profile before applying." };

  const post = await prisma.post.findUnique({
    where: { id: pid.data },
    include: { org: { select: { status: true } }, applications: { select: { status: true, teammateId: true } } },
  });
  if (!post || post.org.status !== "APPROVED") return { ok: false, error: "Project not found." };
  if (post.status !== "OPEN") return { ok: false, error: "This project is no longer taking applications." };
  if (await onPost(post.id, me.id)) return { ok: false, error: "You're already on this project." };

  let teammateId: string | null = null;
  if (teammateEmail) {
    if (teammateEmail === user.email.toLowerCase()) return { ok: false, error: "Your teammate must be someone else." };
    const mate = await prisma.user.findUnique({
      where: { email: teammateEmail },
      select: { role: true, student: { select: { id: true, resumeName: true } } },
    });
    if (!mate || mate.role !== "STUDENT" || !mate.student)
      return { ok: false, error: "No Ed Farm student account uses that teammate email." };
    if (await onPost(post.id, mate.student.id))
      return { ok: false, error: "Your teammate is already on this project." };
    if (!mate.student.resumeName) return { ok: false, error: "Your teammate needs to upload a resume first." };
    teammateId = mate.student.id;
  }

  const free = post.positions - countSeats(post.applications);
  const needed = teammateId ? 2 : 1;
  if (free < needed)
    return { ok: false, error: teammateId ? "A team needs 2 open seats. Try applying alone." : "No seats left." };

  await prisma.application.create({
    data: { postId: post.id, studentId: me.id, teammateId, note },
  });
  refresh(post.id);
  return { ok: true };
}

/** R15: lead withdraws an APPLIED application. */
export async function withdraw(appId: string) {
  const user = await requireUser(["STUDENT"]);
  const id = idSchema.parse(appId);
  const app = await prisma.application.findUnique({ where: { id }, select: { studentId: true, status: true, postId: true } });
  if (!app || app.studentId !== user.student?.id || app.status !== "APPLIED") return;
  await prisma.application.update({ where: { id }, data: { status: "WITHDRAWN" } });
  refresh(app.postId);
}

/** R15: teammate leaves an APPLIED team. */
export async function leaveTeam(appId: string) {
  const user = await requireUser(["STUDENT"]);
  const id = idSchema.parse(appId);
  const app = await prisma.application.findUnique({ where: { id }, select: { teammateId: true, status: true, postId: true } });
  if (!app || !user.student || app.teammateId !== user.student.id || app.status !== "APPLIED") return;
  await prisma.application.update({ where: { id }, data: { teammateId: null } });
  refresh(app.postId);
}

/** R7: owner accepts if seats allow; fills the post and declines the rest when full. */
export async function accept(appId: string) {
  const user = await requireUser(["ORG"]);
  const id = idSchema.parse(appId);
  const orgId = user.org?.id;
  if (!orgId) return;

  const postId = await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id },
      select: { status: true, teammateId: true, post: { select: { id: true, orgId: true, positions: true, status: true } } },
    });
    if (!app || app.post.orgId !== orgId || app.status !== "APPLIED" || app.post.status !== "OPEN") return null;

    const active = await tx.application.findMany({
      where: { postId: app.post.id, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
      select: { status: true, teammateId: true },
    });
    const used = countSeats(active);
    const size = app.teammateId ? 2 : 1;
    if (used + size > app.post.positions) return null;

    await tx.application.update({ where: { id }, data: { status: "IN_PROGRESS", acceptedAt: new Date() } });
    if (used + size === app.post.positions) {
      await tx.post.update({ where: { id: app.post.id }, data: { status: "FILLED" } });
      await tx.application.updateMany({
        where: { postId: app.post.id, status: "APPLIED" },
        data: { status: "DECLINED" },
      });
    }
    return app.post.id;
  });
  if (postId) refresh(postId);
}

export async function decline(appId: string) {
  const user = await requireUser(["ORG"]);
  const id = idSchema.parse(appId);
  const app = await prisma.application.findUnique({
    where: { id },
    select: { status: true, postId: true, post: { select: { orgId: true } } },
  });
  if (!app || !user.org || app.post.orgId !== user.org.id || app.status !== "APPLIED") return;
  await prisma.application.update({ where: { id }, data: { status: "DECLINED" } });
  refresh(app.postId);
}
