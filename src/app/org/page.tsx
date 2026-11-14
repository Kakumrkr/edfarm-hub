import Link from "next/link";
import { AlertTriangle, ClipboardList, Clock, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getOrgDashboard } from "@/server/queries";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function StatusBanner({ status, note }: { status: string; note: string | null }) {
  if (status === "APPROVED") return null;
  const pending = status === "PENDING";
  const Icon = pending ? Clock : AlertTriangle;
  const text = pending
    ? "Ed Farm is reviewing your organization. You can post projects once you're approved."
    : status === "REJECTED"
      ? "Ed Farm did not approve this organization."
      : "Your organization is suspended. Your posts are hidden from students and you can't post new projects.";
  return (
    <div
      role="status"
      className={`mb-8 flex gap-3 rounded-2xl border p-4 text-sm ${
        pending ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        <p className="font-medium">{text}</p>
        {status === "REJECTED" && note && <p className="mt-1">Note from Ed Farm: {note}</p>}
        {!pending && <p className="mt-1">Questions? Contact your Ed Farm coach.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export default async function OrgPage() {
  const user = await requireUser(["ORG"]);
  const org = user.org ? await prisma.org.findUnique({ where: { id: user.org.id } }) : null;
  if (!org) return <EmptyState title="No organization found for this account" />;
  const posts = await getOrgDashboard(org.id);
  const approved = org.status === "APPROVED";

  return (
    <>
      <PageHeader
        title={org.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Your posted projects and applicants.
            {approved ? <VerifiedBadge label="Approved by Ed Farm" /> : <StatusBadge kind="org" status={org.status} />}
          </span>
        }
        actions={
          approved && (
            <ButtonLink href="/org/posts/new">
              <Plus className="size-4" aria-hidden /> New post
            </ButtonLink>
          )
        }
      />
      <StatusBanner status={org.status} note={org.adminNote} />

      {posts.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No projects yet"
          action={approved && <ButtonLink href="/org/posts/new">Post your first project</ButtonLink>}
        >
          {approved ? "Post a small, safe tech project and Ed Farm learners can apply." : "Once approved, your projects will show here."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/org/posts/${p.id}`} className="block">
                <Card className="transition-colors hover:border-emerald-600/40">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold tracking-tight text-stone-900">{p.title}</p>
                      <p className="text-sm text-stone-500">
                        {CATEGORIES[p.category as Category] ?? p.category} · posted {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <StatusBadge kind="comp" status={p.compensationType} />
                      <StatusBadge kind="post" status={p.status} />
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Applicants" value={p.applicants} />
                    <Stat label="In progress" value={p.inProgress} />
                    <Stat label="Completed" value={p.completed} />
                    <Stat label="Seats used" value={`${p.seats}/${p.positions}`} />
                  </dl>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
