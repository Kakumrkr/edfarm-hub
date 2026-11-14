import { Building2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AdminPage() {
  const user = await requireUser(["ADMIN"]);
  return (
    <>
      <PageHeader
        title="Organizations"
        description={`Signed in as ${user.name}. Review new organizations before they can post projects.`}
      />
      <EmptyState icon={Building2} title="Org review arrives in the next build">
        Pending organizations, domain checks and approvals will show here.
      </EmptyState>
    </>
  );
}
