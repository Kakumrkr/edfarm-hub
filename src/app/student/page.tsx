import Link from "next/link";
import { Briefcase, Mail } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CONTACT_LINE } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { leaveTeam, withdraw } from "@/server/actions/application";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

const GROUPS = [
  { title: "Applied", statuses: ["APPLIED"] },
  { title: "In progress", statuses: ["IN_PROGRESS"] },
  { title: "Completed", statuses: ["COMPLETED"] },
  { title: "Closed", statuses: ["DECLINED", "WITHDRAWN", "CANCELLED"] },
];

export default async function StudentPage() {
  const user = await requireUser(["STUDENT"]);
  const me = user.student?.id ?? "";

  const apps = await prisma.application.findMany({
    where: { OR: [{ studentId: me }, { teammateId: me }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      acceptedAt: true,
      studentId: true,
      student: { select: { user: { select: { name: true } } } },
      teammate: { select: { user: { select: { name: true } } } },
      post: {
        select: {
          id: true,
          title: true,
          // Org login email + contact are only rendered for IN_PROGRESS / COMPLETED (R8).
          org: { select: { name: true, contactName: true, user: { select: { email: true } } } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="My work"
        description={`Hi ${user.name.split(" ")[0]}. Track your applications and verified projects.`}
        actions={<ButtonLink href="/posts">Find projects</ButtonLink>}
      />

      {apps.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          action={<ButtonLink href="/posts">Browse open projects</ButtonLink>}
        >
          Apply alone or with one teammate. Your completed work builds a verified track record.
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {GROUPS.map((g) => {
            const list = apps.filter((a) => g.statuses.includes(a.status));
            if (list.length === 0 && g.title === "Closed") return null;
            return (
              <section key={g.title}>
                <CardTitle className="mb-3">
                  {g.title} ({list.length})
                </CardTitle>
                {list.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-4 py-4 text-sm text-stone-500">
                    Nothing here yet.
                  </p>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {list.map((a) => {
                      const isLead = a.studentId === me;
                      const other = isLead ? a.teammate?.user.name : a.student.user.name;
                      const reveal = a.status === "IN_PROGRESS" || a.status === "COMPLETED";
                      return (
                        <li key={a.id}>
                          <Card className="h-full">
                            <div className="mb-2 flex flex-wrap gap-2">
                              <StatusBadge kind="app" status={a.status} />
                              <Badge>{isLead ? "Lead" : "Teammate"}</Badge>
                            </div>
                            <Link
                              href={`/posts/${a.post.id}`}
                              className="font-semibold tracking-tight text-stone-900 hover:text-emerald-800"
                            >
                              {a.post.title}
                            </Link>
                            <p className="text-sm text-stone-500">
                              {a.post.org.name} · applied {formatDate(a.createdAt)}
                            </p>
                            {other && <p className="mt-1 text-sm text-stone-600">With {other}</p>}

                            {reveal && (
                              <div className="mt-3 rounded-xl bg-amber-50/60 px-3 py-2 text-sm">
                                <p className="font-medium text-stone-900">{a.post.org.contactName}</p>
                                <a
                                  href={`mailto:${a.post.org.user.email}`}
                                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
                                >
                                  <Mail className="size-4" aria-hidden /> {a.post.org.user.email}
                                </a>
                                <p className="mt-1 text-xs text-stone-500">{CONTACT_LINE}</p>
                              </div>
                            )}

                            {a.status === "APPLIED" && (
                              <form action={(isLead ? withdraw : leaveTeam).bind(null, a.id)} className="mt-3">
                                <SubmitButton variant="secondary" size="sm" pendingText="Saving">
                                  {isLead ? "Withdraw" : "Leave team"}
                                </SubmitButton>
                              </form>
                            )}
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
