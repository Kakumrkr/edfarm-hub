import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_LOGINS, DEMO_MODE } from "@/lib/config";
import { ROLE_HOME } from "@/lib/constants";
import { demoLogin } from "@/server/actions/auth";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

const ICONS = [ShieldCheck, Building2, Building2, GraduationCap, GraduationCap, GraduationCap];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_1.1fr]">
      <Card>
        <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-2 mb-6 text-stone-500">Welcome back. Pick up where your projects left off.</p>
        <LoginForm />
        <p className="mt-6 text-sm text-stone-500">
          New here?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            Create an account
          </Link>
        </p>
      </Card>

      {DEMO_MODE && (
        <section aria-labelledby="demo-heading" className="notebook-rule rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="demo-heading" className="text-lg font-semibold tracking-tight">
            Try a demo account
          </h2>
          <p className="mt-1 mb-5 text-sm text-stone-500">One click, no password. Sample data only.</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {DEMO_LOGINS.map((d, i) => {
              const Icon = ICONS[i] ?? GraduationCap;
              return (
                <li key={d.email}>
                  <form action={demoLogin.bind(null, d.email)}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left shadow-sm transition-colors hover:border-emerald-600/40 hover:bg-emerald-50/50"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-stone-100 text-stone-600">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-sm font-medium text-stone-900">{d.label}</span>
                        <span className="block truncate text-xs text-stone-500">{d.hint}</span>
                      </span>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
