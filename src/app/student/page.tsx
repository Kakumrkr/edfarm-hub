import { Briefcase } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default async function StudentPage() {
  const user = await requireUser(["STUDENT"]);
  return (
    <>
      <PageHeader
        title="My work"
        description={`Hi ${user.name.split(" ")[0]}. Track your applications and verified projects.`}
        actions={<ButtonLink href="/posts">Find projects</ButtonLink>}
      />
      <EmptyState icon={Briefcase} title="Your applications will show here">
        Applied, in progress and completed projects arrive in the next build.
      </EmptyState>
    </>
  );
}
