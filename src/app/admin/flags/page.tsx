import Link from "next/link";
import { CheckCircle2, Flag as FlagIcon } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { resolveFlag, suspendOrgFromFlag } from "@/server/actions/admin-flags";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubmitButton } from "@/components/ui/submit-button";

const flagInclude = {
  org: { select: { name: true, status: true } },
  student: { select: { id: true, user: { select: { name: true } } } },
  application: { select: { post: { select: { title: true } } } },
} as const;

export default async function AdminFlagsPage() {
  await requireUser(["ADMIN"]);
  const [open, resolved] = await Promise.all([
    prisma.flag.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, include: flagInclude }),
    prisma.flag.findMany({ where: { status: "RESOLVED" }, orderBy: { createdAt: "desc" }, take: 20, include: flagInclude }),
  ]);

  return (
    <>
      <PageHeader title="Reports" description="Students can report an organization. Resolve the report or suspend the org." />

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          Open reports <Badge tone="amber">{open.length}</Badge>
        </h2>
        {open.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No open reports">
            Nothing needs your attention right now.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {open.map((f) => (
              <li key={f.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
                        {f.org.name} <StatusBadge kind="org" status={f.org.status} />
                      </p>
                      <p className="text-sm text-stone-500">
                        Reported by{" "}
                        <Link href={`/s/${f.student.id}`} className="font-medium text-emerald-700 hover:text-emerald-800">
                          {f.student.user.name}
                        </Link>
                        {f.application ? ` · ${f.application.post.title}` : ""} · {formatDate(f.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm whitespace-pre-line break-words text-stone-700">{f.reason}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-4">
                    <form action={resolveFlag.bind(null, f.id)}>
                      <SubmitButton size="sm" variant="secondary" pendingText="Resolving">
                        Resolve
                      </SubmitButton>
                    </form>
                    {f.org.status === "APPROVED" && (
                      <form action={suspendOrgFromFlag.bind(null, f.id)}>
                        <SubmitButton size="sm" variant="danger" pendingText="Suspending">
                          Suspend org
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Resolved</h2>
        {resolved.length === 0 ? (
          <EmptyState icon={FlagIcon} title="No resolved reports yet" />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-stone-100 text-stone-500">
              {resolved.map((f) => (
                <li key={f.id} className="px-5 py-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-700">{f.org.name}</span>
                    <StatusBadge kind="org" status={f.org.status} />
                    <span>· {f.student.user.name}</span>
                    <span>· {formatDate(f.createdAt)}</span>
                  </p>
                  <p className="mt-1 truncate">{f.reason}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </>
  );
}
