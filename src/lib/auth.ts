import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./session";
import { ROLE_HOME, type Role } from "./constants";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      org: { select: { id: true, name: true, status: true, type: true } },
      student: { select: { id: true } },
    },
  });
  if (!user) return null;
  return { ...user, role: user.role as Role };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Redirects to /login when signed out, or to the user's own dashboard on wrong role. */
export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect(ROLE_HOME[user.role]);
  return user;
}
