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

const orgSchema = z.object({
  name: z.string().trim().min(2, "Enter the organization name.").max(100),
  type: z.enum(["STARTUP", "NONPROFIT"], "Choose startup or nonprofit."),
  website: z
    .string()
    .trim()
    .min(4, "Enter your website.")
    .max(200)
    .transform((v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`))
    .pipe(z.url("Enter a valid website.")),
  contactName: z.string().trim().min(2, "Enter a contact name.").max(100),
  description: z.string().trim().min(20, "Describe your organization (20+ characters).").max(1000),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password needs at least 8 characters.").max(200),
});

/** R1: creates User ORG + Org PENDING, logs in, goes to /org. */
export async function registerOrg(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = orgSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details." };
  const d = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { ok: false, error: "An account with this email already exists." };

  const user = await prisma.user.create({
    data: {
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 10),
      role: "ORG",
      name: d.contactName,
      org: {
        create: {
          name: d.name,
          type: d.type,
          website: d.website,
          contactName: d.contactName,
          description: d.description,
          status: "PENDING",
        },
      },
    },
  });

  await createSession({ userId: user.id, role: "ORG" });
  redirect("/org");
}

const studentSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password needs at least 8 characters.").max(200),
  cohort: z.string().trim().max(60).default(""),
  skills: z.string().trim().max(300).default(""),
  bio: z.string().trim().max(600).default(""),
});

/** Creates User STUDENT + Student, logs in, goes to /student/profile. */
export async function registerStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details." };
  const d = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { ok: false, error: "An account with this email already exists." };

  const user = await prisma.user.create({
    data: {
      email: d.email,
      passwordHash: await bcrypt.hash(d.password, 10),
      role: "STUDENT",
      name: d.name,
      student: {
        create: {
          cohort: d.cohort,
          skills: d.skills.split(",").map((s) => s.trim()).filter(Boolean).join(", "),
          bio: d.bio,
        },
      },
    },
  });

  await createSession({ userId: user.id, role: "STUDENT" });
  redirect("/student/profile");
}
