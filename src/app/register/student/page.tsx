import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StudentRegisterForm } from "./student-register-form";

export const metadata: Metadata = { title: "Join as an Ed Farm student" };

export default async function RegisterStudentPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Join as an Ed Farm student"
        description="Apply to real projects from Birmingham startups and nonprofits, alone or with a teammate."
      />
      <Card>
        <StudentRegisterForm />
      </Card>
    </div>
  );
}
