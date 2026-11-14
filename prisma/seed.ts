import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const COHORT = "Fall 2026 cohort";

async function resumePdf(name: string, cohort: string, skills: string, bio: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const ink = rgb(0.11, 0.1, 0.09);
  const muted = rgb(0.45, 0.43, 0.4);
  let y = 720;
  page.drawText(`${name}, Resume (sample)`, { x: 56, y, size: 22, font: bold, color: ink });
  y -= 26;
  page.drawText("Ed Farm Pathways learner", { x: 56, y, size: 12, font, color: rgb(0.02, 0.47, 0.34) });
  y -= 18;
  page.drawText(cohort, { x: 56, y, size: 11, font, color: muted });
  y -= 40;
  page.drawText("Skills", { x: 56, y, size: 13, font: bold, color: ink });
  y -= 18;
  page.drawText(skills, { x: 56, y, size: 11, font, color: ink });
  y -= 34;
  page.drawText("About", { x: 56, y, size: 13, font: bold, color: ink });
  y -= 18;
  page.drawText(bio, { x: 56, y, size: 11, font, color: ink, maxWidth: 500, lineHeight: 15 });
  y -= 60;
  page.drawText("Sample document generated for a hackathon demo. All details are fictional.", {
    x: 56,
    y: 56,
    size: 9,
    font,
    color: muted,
  });
  return Buffer.from(await doc.save());
}

async function main() {
  // Wipe in dependency order (db:reset already force-resets, this keeps db:seed safe too).
  await prisma.flag.deleteMany();
  await prisma.application.deleteMany();
  await prisma.post.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.student.deleteMany();
  await prisma.org.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Admin
  const admin = await prisma.user.create({
    data: { email: "coach@edfarm.demo", name: "Taylor Brooks", role: "ADMIN", passwordHash },
  });

  // Orgs
  const orgDefs = [
    {
      key: "brightloop",
      name: "Brightloop",
      type: "STARTUP",
      status: "APPROVED",
      email: "founder@brightloop.demo",
      website: "https://brightloop.demo",
      contactName: "Dana Whitfield",
      description: "Booking app for Birmingham barbershops and salons.",
    },
    {
      key: "ferrous",
      name: "Ferrous Labs",
      type: "STARTUP",
      status: "APPROVED",
      email: "team@ferrouslabs.demo",
      website: "https://ferrouslabs.demo",
      contactName: "Luis Ortega",
      description: "Invoicing tool for small contractors.",
    },
    {
      key: "pantry",
      name: "Northside Community Pantry",
      type: "NONPROFIT",
      status: "APPROVED",
      email: "hello@northsidepantry.demo",
      website: "https://northsidepantry.demo",
      contactName: "Gloria Hayes",
      description: "Neighborhood food pantry serving Northside families every week.",
    },
    {
      key: "chess",
      name: "Magic City Youth Chess",
      type: "NONPROFIT",
      status: "PENDING",
      email: "coach@mcyouthchess.demo",
      website: "https://mcyouthchess.demo",
      contactName: "Andre Simmons",
      description: "After-school chess club for middle and high school students.",
    },
    {
      key: "quickcash",
      name: "QuickCash Opportunities",
      type: "STARTUP",
      status: "PENDING",
      email: "quickcash.jobs@freemail.demo",
      website: "https://quickcash-opps.demo",
      contactName: "Recruiter",
      description: "Exciting opportunities for motivated people. Earn fast. Details after signup.",
    },
    {
      key: "velocity",
      name: "Velocity Growth Partners",
      type: "STARTUP",
      status: "APPROVED",
      email: "ops@velocitygrowth.demo",
      website: "https://velocitygrowth.demo",
      contactName: "Kyle Benton",
      description: "Growth agency for early-stage startups.",
    },
  ] as const;

  const orgs: Record<string, { id: string }> = {};
  for (const o of orgDefs) {
    const user = await prisma.user.create({
      data: {
        email: o.email,
        name: o.contactName,
        role: "ORG",
        passwordHash,
        org: {
          create: {
            name: o.name,
            type: o.type,
            status: o.status,
            website: o.website,
            contactName: o.contactName,
            description: o.description,
            reviewedAt: o.status === "APPROVED" ? daysAgo(30) : null,
          },
        },
      },
      include: { org: true },
    });
    orgs[o.key] = user.org!;
  }

  // Students
  const studentDefs = [
    {
      key: "jordan",
      name: "Jordan Ellis",
      email: "jordan@student.demo",
      skills: "Swift, iOS, Manual testing, Bug reports",
      bio: "New to client work. I like breaking iOS apps on purpose and writing clear bug reports.",
      achievements: ["Swift Fundamentals (Pathways module)", "QA Testing Workshop"],
    },
    {
      key: "priya",
      name: "Priya Nair",
      email: "priya@student.demo",
      skills: "iOS, Figma, Usability testing",
      bio: "Designer turned tester. I run usability sessions and turn notes into fixes people can ship.",
      achievements: ["Swift Fundamentals (Pathways module)", "Career Readiness: Professional Communication"],
    },
    {
      key: "aaliyah",
      name: "Aaliyah Carter",
      email: "aaliyah@student.demo",
      skills: "QA, Accessibility, HTML/CSS",
      bio: "Accessibility and QA. I test with keyboard and screen readers and write reports teams can act on.",
      achievements: ["QA Testing Workshop", "Accessibility Basics Workshop", "Git and GitHub Essentials"],
    },
    {
      key: "marcus",
      name: "Marcus Reed",
      email: "marcus@student.demo",
      skills: "JavaScript, React, Testing",
      bio: "Front-end learner. I enjoy fixing layouts and writing tests that catch real bugs.",
      achievements: ["Git and GitHub Essentials"],
    },
  ];

  const achievementDetail: Record<string, string> = {
    "Swift Fundamentals (Pathways module)": "Completed the Swift Fundamentals module in Ed Farm Pathways.",
    "QA Testing Workshop": "Attended and passed the hands-on QA Testing Workshop.",
    "Career Readiness: Professional Communication": "Completed the professional communication track.",
    "Accessibility Basics Workshop": "Completed WCAG basics with keyboard and screen reader labs.",
    "Git and GitHub Essentials": "Completed the Git and GitHub Essentials workshop.",
  };

  const students: Record<string, { id: string }> = {};
  for (const [i, s] of studentDefs.entries()) {
    const resumeData = await resumePdf(s.name, COHORT, s.skills, s.bio);
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        role: "STUDENT",
        passwordHash,
        student: {
          create: {
            bio: s.bio,
            skills: s.skills,
            cohort: COHORT,
            resumeData,
            resumeName: `${s.name.split(" ")[0].toLowerCase()}-resume.pdf`,
            resumeUpdatedAt: daysAgo(10 - i),
            achievements: {
              create: s.achievements.map((title, j) => ({
                title,
                detail: achievementDetail[title] ?? "",
                awardedAt: daysAgo(60 - j * 10),
                addedById: admin.id,
              })),
            },
          },
        },
      },
      include: { student: true },
    });
    students[s.key] = user.student!;
  }

  // Posts and applications
  // 1. Brightloop usability test
  const p1 = await prisma.post.create({
    data: {
      orgId: orgs.brightloop.id,
      title: "Usability test our booking web page",
      description:
        "Walk through booking an appointment on our web page as a first-time customer. Note anything confusing and send us a short write-up with screenshots.",
      category: "QA_TESTING",
      skills: "Usability testing, Bug reports",
      positions: 2,
      compensationType: "STIPEND",
      compensationNote: "$100 stipend",
      estimatedHours: 5,
      beginnerFriendly: true,
      status: "OPEN",
      createdAt: daysAgo(8),
    },
  });
  await prisma.application.create({
    data: {
      postId: p1.id,
      studentId: students.aaliyah.id,
      status: "IN_PROGRESS",
      note: "I've done usability checks on two booking flows before.",
      createdAt: daysAgo(6),
      acceptedAt: daysAgo(3),
    },
  });
  await prisma.application.create({
    data: {
      postId: p1.id,
      studentId: students.priya.id,
      status: "APPLIED",
      note: "I run usability sessions and would love to test this.",
      createdAt: daysAgo(2),
    },
  });

  // 2. Ferrous accessibility audit (completed)
  const p2 = await prisma.post.create({
    data: {
      orgId: orgs.ferrous.id,
      title: "Accessibility audit of our invoicing dashboard",
      description:
        "Check our invoicing dashboard with keyboard only and a screen reader. Log issues with steps and suggested fixes.",
      category: "ACCESSIBILITY",
      skills: "Accessibility, Screen readers",
      positions: 1,
      compensationType: "PAID",
      compensationNote: "$25/hour, about 8 hours",
      estimatedHours: 8,
      status: "FILLED",
      createdAt: daysAgo(40),
    },
  });
  await prisma.application.create({
    data: {
      postId: p2.id,
      studentId: students.aaliyah.id,
      status: "COMPLETED",
      createdAt: daysAgo(38),
      acceptedAt: daysAgo(36),
      doneRequestedAt: daysAgo(30),
      completedAt: daysAgo(29),
      completedBy: "ORG",
      rating: 5,
      review: "Clear, organized report. We fixed most issues the same week.",
      studentSummary:
        "Ran keyboard-only and screen reader checks on 6 screens and logged 14 issues with suggested fixes and screenshots.",
    },
  });

  // 3. Ferrous test cases (open)
  const p3 = await prisma.post.create({
    data: {
      orgId: orgs.ferrous.id,
      title: "Write test cases for invoice export",
      description:
        "Write clear manual test cases for exporting invoices to PDF and CSV, including edge cases like empty invoices and long line items.",
      category: "TEST_CASES",
      skills: "Testing, Test cases",
      positions: 2,
      compensationType: "PAID",
      compensationNote: "$20/hour, about 6 hours",
      estimatedHours: 6,
      status: "OPEN",
      createdAt: daysAgo(5),
    },
  });
  await prisma.application.create({
    data: {
      postId: p3.id,
      studentId: students.marcus.id,
      status: "APPLIED",
      note: "I write tests for my React projects and can cover export edge cases.",
      createdAt: daysAgo(1),
    },
  });

  // 4. Northside mobile layout (team completed)
  const p4 = await prisma.post.create({
    data: {
      orgId: orgs.pantry.id,
      title: "Fix the mobile layout of our volunteer sign-up page",
      description:
        "Our volunteer sign-up form breaks on phones. Fix the layout so it works on small screens. We'll share the page files over email.",
      category: "WEB_FIX",
      skills: "HTML/CSS, Responsive design",
      positions: 2,
      compensationType: "UNPAID",
      estimatedHours: 6,
      status: "FILLED",
      createdAt: daysAgo(25),
    },
  });
  await prisma.application.create({
    data: {
      postId: p4.id,
      studentId: students.aaliyah.id,
      teammateId: students.marcus.id,
      status: "COMPLETED",
      createdAt: daysAgo(24),
      acceptedAt: daysAgo(22),
      doneRequestedAt: daysAgo(16),
      completedAt: daysAgo(15),
      completedBy: "ORG",
      rating: 4,
      review: "Works on phones now. Great communication.",
      studentSummary: "Rebuilt the form layout with flexbox, fixed tap targets, and tested on 3 phone sizes.",
    },
  });

  // 5. Northside donation form (stale in-progress)
  const p5 = await prisma.post.create({
    data: {
      orgId: orgs.pantry.id,
      title: "Check our donation form for bugs on iPhone and Android",
      description:
        "Try our donation form on iPhone and Android phones. Write down any bugs with steps to reproduce. No real payments needed.",
      category: "QA_TESTING",
      skills: "Manual testing, Bug reports",
      positions: 1,
      compensationType: "UNPAID",
      estimatedHours: 3,
      beginnerFriendly: true,
      status: "FILLED",
      createdAt: daysAgo(20),
    },
  });
  await prisma.application.create({
    data: {
      postId: p5.id,
      studentId: students.marcus.id,
      status: "IN_PROGRESS",
      createdAt: daysAgo(18),
      acceptedAt: daysAgo(16),
      doneRequestedAt: daysAgo(6),
      studentSummary: "Found 3 bugs and documented steps to reproduce in a shared sheet.",
    },
  });

  // 6. Velocity MVP (red flag)
  const p6 = await prisma.post.create({
    data: {
      orgId: orgs.velocity.id,
      title: "Build our full MVP",
      description: "We need a full MVP built end to end. Web, mobile, backend. Fast turnaround.",
      category: "OTHER",
      skills: "Full stack",
      positions: 1,
      compensationType: "PAID",
      compensationNote: "Paid after launch",
      status: "OPEN",
      createdAt: daysAgo(7),
    },
  });
  const a6 = await prisma.application.create({
    data: {
      postId: p6.id,
      studentId: students.priya.id,
      status: "APPLIED",
      createdAt: daysAgo(4),
    },
  });
  await prisma.flag.create({
    data: {
      orgId: orgs.velocity.id,
      studentId: students.priya.id,
      applicationId: a6.id,
      reason:
        "They asked for 30+ hours of work before any payment and wanted me to use their production admin login.",
      createdAt: daysAgo(2),
    },
  });

  const counts = {
    users: await prisma.user.count(),
    orgs: await prisma.org.count(),
    students: await prisma.student.count(),
    achievements: await prisma.achievement.count(),
    posts: await prisma.post.count(),
    applications: await prisma.application.count(),
    flags: await prisma.flag.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
