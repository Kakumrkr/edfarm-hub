"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const idSchema = z.string().min(1);

function revalidateApp(app: { postId: string; studentId: string; teammateId: string | null }) {
  revalidatePath("/admin/engagements");
  revalidatePath(`/s/${app.studentId}`);
  if (app.teammateId) revalidatePath(`/s/${app.teammateId}`);
  revalidatePath("/student");
  revalidatePath(`/org/posts/${app.postId}`);
}

async function findApp(appId: string) {
  const id = idSchema.safeParse(appId);
  if (!id.success) return null;
  return prisma.application.findUnique({
    where: { id: id.data },
    select: { id: true, status: true, postId: true, studentId: true, teammateId: true, review: true },
  });
}

export async function adminComplete(appId: string) {
  await requireUser(["ADMIN"]);
  const app = await findApp(appId);
  if (!app || app.status !== "IN_PROGRESS") return;
  await prisma.application.update({
    where: { id: app.id },
    data: { status: "COMPLETED", completedAt: new Date(), completedBy: "ADMIN", rating: null },
  });
  revalidateApp(app);
}

export async function adminCancel(appId: string) {
  await requireUser(["ADMIN"]);
  const app = await findApp(appId);
  if (!app || app.status !== "IN_PROGRESS") return;
  await prisma.application.update({ where: { id: app.id }, data: { status: "CANCELLED" } });
  // Cancelling frees seats: reopen a FILLED post.
  await prisma.post.updateMany({ where: { id: app.postId, status: "FILLED" }, data: { status: "OPEN" } });
  revalidateApp(app);
  revalidatePath("/posts");
  revalidatePath(`/posts/${app.postId}`);
}

export async function setReviewHidden(appId: string, hidden: boolean) {
  await requireUser(["ADMIN"]);
  const flag = z.boolean().safeParse(hidden);
  const app = await findApp(appId);
  if (!flag.success || !app || app.status !== "COMPLETED") return;
  await prisma.application.update({ where: { id: app.id }, data: { reviewHidden: flag.data } });
  revalidateApp(app);
}
