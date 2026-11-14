"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";
import { csvToList, listToCsv } from "@/lib/format";
import type { FormState } from "./auth";

const postSchema = z.object({
  title: z.string().trim().min(5, "Title needs at least 5 characters.").max(120),
  description: z.string().trim().min(30, "Description needs at least 30 characters.").max(3000),
  category: z.enum(Object.keys(CATEGORIES) as [string, ...string[]], "Choose a category."),
  skills: z.string().trim().max(300).default(""),
  positions: z.coerce.number().int().min(1, "Positions: 1 to 5.").max(5, "Positions: 1 to 5."),
  estimatedHours: z.string().trim().max(4).default(""),
  compensationType: z.enum(["PAID", "STIPEND", "UNPAID"], "Choose compensation."),
  compensationNote: z.string().trim().max(120).default(""),
  beginnerFriendly: z.literal("on").optional(),
  safety: z.literal("on", "Confirm the safety checklist to publish."),
});

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser(["ORG"]);
  const org = user.org ? await prisma.org.findUnique({ where: { id: user.org.id } }) : null;
  // R1: only APPROVED orgs can post.
  if (!org || org.status !== "APPROVED")
    return { ok: false, error: "Your organization must be approved by Ed Farm before posting." };

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const d = parsed.data;

  let hours: number | null = null;
  if (d.estimatedHours) {
    hours = Number(d.estimatedHours);
    if (!Number.isInteger(hours) || hours < 1 || hours > 200)
      return { ok: false, error: "Estimated hours: a whole number from 1 to 200." };
  }

  // R3: startups can't use UNPAID; paid work needs a note.
  if (org.type === "STARTUP" && d.compensationType === "UNPAID")
    return { ok: false, error: "Startups must offer paid work or a stipend." };
  if (d.compensationType !== "UNPAID" && d.compensationNote.length < 2)
    return { ok: false, error: 'Add a compensation note, for example "$150 stipend".' };

  const post = await prisma.post.create({
    data: {
      orgId: org.id,
      title: d.title,
      description: d.description,
      category: d.category,
      skills: listToCsv(csvToList(d.skills)),
      positions: d.positions,
      estimatedHours: hours,
      compensationType: d.compensationType,
      compensationNote: d.compensationNote,
      beginnerFriendly: d.beginnerFriendly === "on",
      aiDrafted: formData.get("aiDrafted") === "true",
    },
  });

  revalidatePath("/org");
  revalidatePath("/posts");
  redirect(`/org/posts/${post.id}`);
}

export async function closePost(postId: string) {
  const user = await requireUser(["ORG"]);
  const id = z.string().min(1).parse(postId);
  const post = await prisma.post.findUnique({ where: { id }, select: { orgId: true, status: true } });
  if (!post || !user.org || post.orgId !== user.org.id || post.status === "CLOSED") return;
  await prisma.post.update({ where: { id }, data: { status: "CLOSED" } });
  revalidatePath(`/org/posts/${id}`);
  revalidatePath("/org");
  revalidatePath("/posts");
}
