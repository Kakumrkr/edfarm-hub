import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, GraduationCap } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Create an account" };

const CHOICES = [
  {
    href: "/register/org",
    icon: Building2,
    title: "Organization",
    text: "A Birmingham startup or nonprofit with small tech projects. Ed Farm reviews every organization before it can post.",
  },
  {
    href: "/register/student",
    icon: GraduationCap,
    title: "Ed Farm student",
    text: "An Ed Farm learner looking for real, verified project experience, alone or with a teammate.",
  },
];

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create an account" description="Who are you joining as?" />
      <div className="grid gap-4 sm:grid-cols-2">
        {CHOICES.map(({ href, icon: Icon, title, text }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-colors hover:border-emerald-600/40 hover:bg-emerald-50/40"
          >
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight text-stone-900">{title}</span>
            <span className="mt-1 flex-1 text-sm text-stone-500">{text}</span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 group-hover:text-emerald-800">
              Continue <ArrowRight className="size-4" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-stone-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
          Log in
        </Link>
      </p>
    </div>
  );
}
