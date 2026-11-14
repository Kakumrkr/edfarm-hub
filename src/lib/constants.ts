export type Tone = "emerald" | "amber" | "red" | "sky" | "stone" | "violet";

export const ROLES = { ADMIN: "ADMIN", ORG: "ORG", STUDENT: "STUDENT" } as const;
export type Role = keyof typeof ROLES;

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin",
  ORG: "/org",
  STUDENT: "/student",
};

type Labeled = { label: string; tone: Tone };

export const ORG_TYPES = { STARTUP: "Startup", NONPROFIT: "Nonprofit" } as const;
export type OrgType = keyof typeof ORG_TYPES;

export const ORG_STATUS = {
  PENDING: { label: "Pending review", tone: "amber" },
  APPROVED: { label: "Approved", tone: "emerald" },
  REJECTED: { label: "Rejected", tone: "red" },
  SUSPENDED: { label: "Suspended", tone: "red" },
} as const satisfies Record<string, Labeled>;
export type OrgStatus = keyof typeof ORG_STATUS;

export const POST_STATUS = {
  OPEN: { label: "Open", tone: "emerald" },
  FILLED: { label: "Filled", tone: "stone" },
  CLOSED: { label: "Closed", tone: "stone" },
} as const satisfies Record<string, Labeled>;
export type PostStatus = keyof typeof POST_STATUS;

export const APP_STATUS = {
  APPLIED: { label: "Applied", tone: "sky" },
  IN_PROGRESS: { label: "In progress", tone: "amber" },
  COMPLETED: { label: "Completed", tone: "emerald" },
  DECLINED: { label: "Declined", tone: "stone" },
  WITHDRAWN: { label: "Withdrawn", tone: "stone" },
  CANCELLED: { label: "Cancelled", tone: "stone" },
} as const satisfies Record<string, Labeled>;
export type AppStatus = keyof typeof APP_STATUS;

export const COMP_TYPES = {
  PAID: { label: "Paid", tone: "emerald" },
  STIPEND: { label: "Stipend", tone: "sky" },
  UNPAID: { label: "Volunteer", tone: "violet" },
} as const satisfies Record<string, Labeled>;
export type CompType = keyof typeof COMP_TYPES;

export const CATEGORIES = {
  IOS_TESTING: "iOS app testing",
  QA_TESTING: "QA / usability testing",
  WEB_FIX: "Website fix",
  ACCESSIBILITY: "Accessibility audit",
  PERFORMANCE_SEO: "Performance / SEO audit",
  TEST_CASES: "Write test cases",
  OTHER: "Other",
} as const;
export type Category = keyof typeof CATEGORIES;

export const FLAG_STATUS = {
  OPEN: { label: "Open", tone: "red" },
  RESOLVED: { label: "Resolved", tone: "stone" },
} as const satisfies Record<string, Labeled>;

export const SAFETY_TEXT =
  "This project needs no production passwords, no customer data, and no security testing.";
export const CONTACT_LINE = "Work together over email. The portal only tracks status.";
