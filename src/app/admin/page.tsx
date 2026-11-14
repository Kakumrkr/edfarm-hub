import { AlertTriangle, Building2, CheckCircle2, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORG_TYPES, type OrgType } from "@/lib/constants";
import { domainsMatch, formatDate, websiteHost } from "@/lib/format";
import { approveOrg, reinstateOrg, rejectOrg, suspendOrg } from "@/server/actions/admin";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

function DomainCheck({ email, website }: { email: string; website: string }) {
  return domainsMatch(email, website) ? (
    <Badge tone="emerald">
      <CheckCircle2 className="size-3.5" aria-hidden /> Domain matches
    </Badge>
  ) : (
    <Badge tone="red">
      <AlertTriangle className="size-3.5" aria-hidden /> Domain mismatch
    </Badge>
  );
}

export default async function AdminPage() {
  const user = await requireUser(["ADMIN"]);
  const orgs = await prisma.org.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } }, _count: { select: { posts: true } } },
  });
  const pending = orgs.filter((o) => o.status === "PENDING");
  const others = orgs.filter((o) => o.status !== "PENDING");

  return (
    <>
      <PageHeader
        title="Organizations"
        description={`Signed in as ${user.name}. Review new organizations before they can post projects.`}
      />

      <section className="mb-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
          Waiting for review <Badge tone="amber">{pending.length}</Badge>
        </h2>
        {pending.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All caught up">
            No organizations are waiting for review.
          </EmptyState>
        ) : (
          <ul className="space-y-4">
            {pending.map((o) => (
              <li key={o.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold tracking-tight">{o.name}</p>
                      <p className="text-sm text-stone-500">
                        {ORG_TYPES[o.type as OrgType] ?? o.type} · {o.contactName} · applied {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <DomainCheck email={o.user.email} website={o.website} />
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-stone-500">Login email</dt>
                      <dd className="truncate font-medium">{o.user.email}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-stone-500">Website</dt>
                      <dd className="truncate font-medium">
                        <a
                          href={o.website}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
                        >
                          {websiteHost(o.website) || o.website} <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm text-stone-700">{o.description}</p>
                  <div className="mt-5 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center">
                    <form action={approveOrg.bind(null, o.id)}>
                      <SubmitButton size="sm" pendingText="Approving">
                        Approve
                      </SubmitButton>
                    </form>
                    <form action={rejectOrg.bind(null, o.id)} className="flex flex-1 gap-2">
                      <Input name="note" placeholder="Optional note to the org" maxLength={500} className="h-8" aria-label="Rejection note" />
                      <SubmitButton size="sm" variant="danger" pendingText="Rejecting">
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">All organizations</h2>
        {others.length === 0 ? (
          <EmptyState icon={Building2} title="No reviewed organizations yet" />
        ) : (
          <Card className="p-0 sm:p-0">
            <ul className="divide-y divide-stone-100">
              {others.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {o.name} <StatusBadge kind="org" status={o.status} />
                    </p>
                    <p className="truncate text-sm text-stone-500">
                      {ORG_TYPES[o.type as OrgType] ?? o.type} · {o.user.email} · {o._count.posts} posts
                      {o.adminNote ? ` · Note: ${o.adminNote}` : ""}
                    </p>
                  </div>
                  <DomainCheck email={o.user.email} website={o.website} />
                  {o.status === "APPROVED" && (
                    <form action={suspendOrg.bind(null, o.id)}>
                      <SubmitButton size="sm" variant="secondary" pendingText="Suspending">
                        Suspend
                      </SubmitButton>
                    </form>
                  )}
                  {o.status === "SUSPENDED" && (
                    <form action={reinstateOrg.bind(null, o.id)}>
                      <SubmitButton size="sm" variant="secondary" pendingText="Reinstating">
                        Reinstate
                      </SubmitButton>
                    </form>
                  )}
                  {o.status === "REJECTED" && (
                    <form action={approveOrg.bind(null, o.id)}>
                      <SubmitButton size="sm" variant="secondary" pendingText="Approving">
                        Approve
                      </SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </>
  );
}
