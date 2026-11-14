import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function OrgPage() {
  const user = await requireUser(["ORG"]);
  return (
    <>
      <PageHeader
        title={user.org?.name ?? "My projects"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            Your posted projects and applicants.
            {user.org && <StatusBadge kind="org" status={user.org.status} />}
          </span>
        }
      />
      <EmptyState icon={ClipboardList} title="Your projects will show here">
        Posting and applicant review arrive in the next build.
      </EmptyState>
    </>
  );
}
