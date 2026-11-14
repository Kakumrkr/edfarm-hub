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

const summarySchema = z
  .string()
  .trim()
  .min(20, "Summary: at least 20 characters. Say what you did and how.")
  .max(400, "Summary: 400 characters max.");

async function memberApp(appId: string, studentId: string | undefined) {
  const id = idSchema.safeParse(appId);
  if (!id.success || !studentId) return null;
  const app = await prisma.application.findUnique({
    where: { id: id.data },
    select: { id: true, status: true, postId: true, studentId: true, teammateId: true, post: { select: { orgId: true } } },
  });
  if (!app || (app.studentId !== studentId && app.teammateId !== studentId)) return null;
  return app;
}

function refreshProfiles(app: { studentId: string; teammateId: string | null }) {
  revalidatePath(`/s/${app.studentId}`);
  if (app.teammateId) revalidatePath(`/s/${app.teammateId}`);
  revalidatePath("/");
}

/** R10: lead or teammate on IN_PROGRESS marks done with a summary. */
export async function markDone(appId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const app = await memberApp(appId, user.student?.id);
  if (!app) return { ok: false, error: "Project not found." };
  if (app.status !== "IN_PROGRESS") return { ok: false, error: "Only in-progress work can be marked done." };
  const summary = summarySchema.safeParse(formData.get("summary") ?? "");
  if (!summary.success) return { ok: false, error: summary.error.issues[0]?.message ?? "Check the summary." };
  await prisma.application.update({
    where: { id: app.id },
    data: { doneRequestedAt: new Date(), studentSummary: summary.data },
  });
  refresh(app.postId);
  return { ok: true };
}

/** R10: either member edits the summary while IN_PROGRESS or COMPLETED. */
export async function updateSummary(appId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const app = await memberApp(appId, user.student?.id);
  if (!app) return { ok: false, error: "Project not found." };
  if (app.status !== "IN_PROGRESS" && app.status !== "COMPLETED")
    return { ok: false, error: "This summary can't be edited anymore." };
  const summary = summarySchema.safeParse(formData.get("summary") ?? "");
  if (!summary.success) return { ok: false, error: summary.error.issues[0]?.message ?? "Check the summary." };
  await prisma.application.update({ where: { id: app.id }, data: { studentSummary: summary.data } });
  refresh(app.postId);
  refreshProfiles(app);
  return { ok: true };
}

const completeSchema = z.object({
  rating: z.union([z.literal(""), z.coerce.number().int().min(1).max(5)]).default(""),
  review: z.string().trim().max(600, "Review: 600 characters max.").default(""),
});

/** R11: owner marks IN_PROGRESS work completed, with optional rating and review. */
export async function complete(appId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["ORG"]);
  const id = idSchema.safeParse(appId);
  if (!id.success || !user.org) return { ok: false, error: "Project not found." };
  const parsed = completeSchema.safeParse({
    rating: formData.get("rating") ?? "",
    review: formData.get("review") ?? "",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const app = await prisma.application.findUnique({
    where: { id: id.data },
    select: { id: true, status: true, postId: true, studentId: true, teammateId: true, post: { select: { orgId: true } } },
  });
  if (!app || app.post.orgId !== user.org.id) return { ok: false, error: "Project not found." };
  if (app.status !== "IN_PROGRESS") return { ok: false, error: "Only in-progress work can be completed." };
  const { rating, review } = parsed.data;
  await prisma.application.update({
    where: { id: app.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedBy: "ORG",
      rating: rating === "" ? null : rating,
      review: review || null,
    },
  });
  refresh(app.postId);
  refreshProfiles(app);
  return { ok: true };
}

/** R14: lead or teammate reports the org on one of their applications. */
export async function reportOrg(appId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  const app = await memberApp(appId, user.student?.id);
  if (!app || !user.student) return { ok: false, error: "Project not found." };
  const reason = z
    .string()
    .trim()
    .min(10, "Reason: at least 10 characters.")
    .max(500, "Reason: 500 characters max.")
    .safeParse(formData.get("reason") ?? "");
  if (!reason.success) return { ok: false, error: reason.error.issues[0]?.message ?? "Check the reason." };
  await prisma.flag.create({
    data: { orgId: app.post.orgId, studentId: user.student.id, applicationId: app.id, reason: reason.data },
  });
  revalidatePath("/admin/flags");
  return { ok: true };
}
