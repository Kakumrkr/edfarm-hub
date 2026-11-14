import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MAX_BYTES = 2 * 1024 * 1024;

function back(req: Request, query: string) {
  return NextResponse.redirect(new URL(`/student/profile?${query}`, req.url), 303);
}

/** Multipart upload from /student/profile. PDF only, max 2 MB, stored in the DB. */
export async function POST(req: Request) {
  const user = await requireUser(["STUDENT"]);
  if (!user.student) return back(req, "resume=error");

  const form = await req.formData().catch(() => null);
  const file = form?.get("resume");
  if (!(file instanceof File) || file.size === 0) return back(req, "resume=missing");
  if (file.size > MAX_BYTES) return back(req, "resume=toobig");

  const bytes = new Uint8Array(await file.arrayBuffer());
  // PDF magic bytes "%PDF" plus the declared type or extension.
  const isPdf =
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
  if (!isPdf) return back(req, "resume=notpdf");

  const name = file.name.replace(/[^\w.\- ]/g, "_").slice(0, 100) || "resume.pdf";
  await prisma.student.update({
    where: { id: user.student.id },
    data: { resumeData: bytes, resumeName: name, resumeUpdatedAt: new Date() },
  });
  revalidatePath("/student/profile");
  return back(req, "resume=uploaded");
}
