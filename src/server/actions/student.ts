"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { csvToList, listToCsv } from "@/lib/format";
import type { FormState } from "./auth";

const profileSchema = z.object({
  cohort: z.string().trim().max(60).default(""),
  skills: z.string().trim().max(300).default(""),
  bio: z.string().trim().max(600, "Bio: 600 characters max.").default(""),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["STUDENT"]);
  if (!user.student) return { ok: false, error: "Student profile not found." };
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;

  await prisma.student.update({
    where: { id: user.student.id },
    data: { cohort: d.cohort, skills: listToCsv(csvToList(d.skills)), bio: d.bio },
  });
  revalidatePath("/student/profile");
  revalidatePath(`/s/${user.student.id}`);
  return { ok: true };
}
