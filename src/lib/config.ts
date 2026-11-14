export const APP_NAME = "SideQuest BHM";
export const DEMO_MODE = process.env.DEMO_MODE === "true";
export const AI_ENABLED = Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);

/** Seeded accounts allowed for demo quick-login (R18). */
export const DEMO_LOGINS = [
  { email: "coach@edfarm.demo", label: "Ed Farm admin", hint: "Taylor Brooks" },
  { email: "founder@brightloop.demo", label: "Brightloop startup", hint: "Dana Whitfield" },
  { email: "hello@northsidepantry.demo", label: "Northside Pantry nonprofit", hint: "Gloria Hayes" },
  { email: "jordan@student.demo", label: "Jordan", hint: "New student" },
  { email: "priya@student.demo", label: "Priya", hint: "Teammate" },
  { email: "aaliyah@student.demo", label: "Aaliyah", hint: "Experienced student" },
] as const;
