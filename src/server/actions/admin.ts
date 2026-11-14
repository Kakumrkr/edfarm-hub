"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const idSchema = z.string().min(1);

async function setStatus(orgId: string, status: string, from: string[], adminNote?: string | null) {
  const id = idSchema.parse(orgId);
  const org = await prisma.org.findUnique({ where: { id }, select: { status: true } });
  if (!org || !from.includes(org.status)) return;
  await prisma.org.update({
    where: { id },
    data: { status, reviewedAt: new Date(), ...(adminNote !== undefined ? { adminNote } : {}) },
  });
  revalidatePath("/admin");
  revalidatePath("/org");
  revalidatePath("/posts");
}

export async function approveOrg(orgId: string) {
  await requireUser(["ADMIN"]);
  await setStatus(orgId, "APPROVED", ["PENDING", "REJECTED"], null);
}

export async function rejectOrg(orgId: string, formData: FormData) {
  await requireUser(["ADMIN"]);
  const note = z.string().trim().max(500).safeParse(formData.get("note") ?? "");
  await setStatus(orgId, "REJECTED", ["PENDING"], note.success && note.data ? note.data : null);
}

export async function suspendOrg(orgId: string) {
  await requireUser(["ADMIN"]);
  await setStatus(orgId, "SUSPENDED", ["APPROVED"]);
}

export async function reinstateOrg(orgId: string) {
  await requireUser(["ADMIN"]);
  await setStatus(orgId, "APPROVED", ["SUSPENDED"]);
}
