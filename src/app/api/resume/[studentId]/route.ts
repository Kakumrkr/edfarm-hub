import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** R9: ADMIN, the student, or an ORG with any application from this student (lead or teammate). */
export async function GET(_req: Request, ctx: RouteContext<"/api/resume/[studentId]">) {
  const user = await requireUser(["ADMIN", "ORG", "STUDENT"]);
  const { studentId } = await ctx.params;

  let allowed = false;
  if (user.role === "ADMIN") allowed = true;
  else if (user.role === "STUDENT") allowed = user.student?.id === studentId;
  else if (user.role === "ORG" && user.org) {
    const app = await prisma.application.findFirst({
      where: { post: { orgId: user.org.id }, OR: [{ studentId }, { teammateId: studentId }] },
      select: { id: true },
    });
    allowed = !!app;
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { resumeData: true, resumeName: true },
  });
  if (!student?.resumeData) return new Response("No resume uploaded", { status: 404 });

  const filename = (student.resumeName ?? "resume.pdf").replace(/[^\w.\- ]/g, "_");
  return new Response(new Uint8Array(student.resumeData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
