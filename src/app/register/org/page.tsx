import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { OrgRegisterForm } from "./org-register-form";

export const metadata: Metadata = { title: "Register your organization" };

export default async function RegisterOrgPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Register your organization"
        description="Ed Farm staff review every organization before it can post. Use an email on your website's domain to speed this up."
      />
      <Card>
        <OrgRegisterForm />
      </Card>
    </div>
  );
}
