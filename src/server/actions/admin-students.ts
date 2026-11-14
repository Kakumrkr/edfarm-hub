"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const idSchema = z.string().min(1);

const achievementSchema = z.object({
  title: z.string().trim().min(2).max(80),
  detail: z.string().trim().max(200),
});

function revalidate(studentId: string) {
  revalidatePath("/admin/students");
  revalidatePath(`/s/${studentId}`);
}

export async function addAchievement(studentId: string, formData: FormData) {
  const user = await requireUser(["ADMIN"]);
  const id = idSchema.safeParse(studentId);
  const parsed = achievementSchema.safeParse({
    title: formData.get("title") ?? "",
    detail: formData.get("detail") ?? "",
  });
  if (!id.success || !parsed.success) return;
  const student = await prisma.student.findUnique({ where: { id: id.data }, select: { id: true } });
  if (!student) return;
  await prisma.achievement.create({
    data: { studentId: student.id, title: parsed.data.title, detail: parsed.data.detail, addedById: user.id },
  });
  revalidate(student.id);
}

export async function removeAchievement(achievementId: string) {
  await requireUser(["ADMIN"]);
  const id = idSchema.safeParse(achievementId);
  if (!id.success) return;
  const achievement = await prisma.achievement.findUnique({ where: { id: id.data }, select: { studentId: true } });
  if (!achievement) return;
  await prisma.achievement.delete({ where: { id: id.data } });
  revalidate(achievement.studentId);
}
