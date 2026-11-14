import Link from "next/link";
import { LogOut, Sprout } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import { logout } from "@/server/actions/auth";
import { ButtonLink } from "./ui/button";
import { InitialsAvatar } from "./ui/initials-avatar";

const NAV: Record<Role, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/admin", label: "Organizations" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/engagements", label: "Engagements" },
    { href: "/admin/flags", label: "Reports" },
  ],
  ORG: [
    { href: "/org", label: "My projects" },
    { href: "/org/posts/new", label: "New project" },
  ],
  STUDENT: [
    { href: "/posts", label: "Find projects" },
    { href: "/student", label: "My work" },
    { href: "/student/profile", label: "Profile" },
  ],
};

const ROLE_LABEL: Record<Role, string> = { ADMIN: "Ed Farm staff", ORG: "Organization", STUDENT: "Student" };

export async function SiteHeader() {
  const user = await getCurrentUser();
  const nav = user ? NAV[user.role] : [];

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-stone-900">
          <span className="grid size-7 place-items-center rounded-lg bg-emerald-700 text-white">
            <Sprout className="size-4" aria-hidden />
          </span>
          {APP_NAME}
        </Link>

        {nav.length > 0 && (
          <nav aria-label="Main" className="order-last -mx-2 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2.5 py-1.5 text-sm whitespace-nowrap text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <InitialsAvatar name={user.name} size="sm" />
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-medium text-stone-900">{user.org?.name ?? user.name}</p>
                  <p className="text-xs text-stone-500">{ROLE_LABEL[user.role]}</p>
                </div>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                >
                  <LogOut className="size-4" aria-hidden />
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
