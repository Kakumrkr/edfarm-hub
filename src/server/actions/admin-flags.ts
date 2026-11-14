"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const idSchema = z.string().min(1);

function revalidateAll() {
  revalidatePath("/admin/flags");
  revalidatePath("/admin");
  revalidatePath("/posts");
  revalidatePath("/org");
}

export async function resolveFlag(flagId: string) {
  await requireUser(["ADMIN"]);
  const parsed = idSchema.safeParse(flagId);
  if (!parsed.success) return;
  await prisma.flag.updateMany({ where: { id: parsed.data, status: "OPEN" }, data: { status: "RESOLVED" } });
  revalidateAll();
}

export async function suspendOrgFromFlag(flagId: string) {
  await requireUser(["ADMIN"]);
  const parsed = idSchema.safeParse(flagId);
  if (!parsed.success) return;
  const flag = await prisma.flag.findUnique({
    where: { id: parsed.data },
    select: { orgId: true, org: { select: { status: true } } },
  });
  if (!flag) return;
  await prisma.$transaction([
    ...(flag.org.status === "APPROVED"
      ? [prisma.org.update({ where: { id: flag.orgId }, data: { status: "SUSPENDED", reviewedAt: new Date() } })]
      : []),
    prisma.flag.updateMany({ where: { id: parsed.data, status: "OPEN" }, data: { status: "RESOLVED" } }),
  ]);
  revalidateAll();
}
