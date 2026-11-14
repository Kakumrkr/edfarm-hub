import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PostForm } from "./post-form";

export const metadata: Metadata = { title: "New project" };

export default async function NewPostPage() {
  const user = await requireUser(["ORG"]);
  if (!user.org || user.org.status !== "APPROVED") redirect("/org");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New project"
        description="Keep it small and safe: a few hours of testing, auditing or fixing that a learner can own."
      />
      <Card>
        <PostForm orgType={user.org.type} />
      </Card>
    </div>
  );
}
