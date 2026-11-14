"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";
import { DEMO_LOGINS, DEMO_MODE } from "@/lib/config";
import { ROLE_HOME, type Role } from "@/lib/constants";

export type FormState = { ok: boolean; error?: string } | null;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) return { ok: false, error: "Email or password is incorrect." };

  const role = user.role as Role;
  await createSession({ userId: user.id, role });
  redirect(ROLE_HOME[role]);
}

/** R18: only when DEMO_MODE=true and only for seeded demo emails. */
export async function demoLogin(email: string) {
  if (!DEMO_MODE) redirect("/login");
  if (!DEMO_LOGINS.some((d) => d.email === email)) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login");

  const role = user.role as Role;
  await createSession({ userId: user.id, role });
  redirect(ROLE_HOME[role]);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
