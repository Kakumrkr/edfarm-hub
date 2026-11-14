import { Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PostsPage() {
  await requireUser(["STUDENT"]);
  return (
    <>
      <PageHeader
        title="Find projects"
        description="Real projects from Birmingham startups and nonprofits approved by Ed Farm."
      />
      <EmptyState icon={Search} title="Open projects will show here">
        Browsing and filters arrive in the next build.
      </EmptyState>
    </>
  );
}
