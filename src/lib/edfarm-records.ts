// Mock of Ed Farm's learner records (read-only). In production this would be an API call to Ed Farm.
// All records are fictional sample data. Nothing in the app writes to this.

export type EdFarmRecord = {
  cohort: string;
  completed: readonly { title: string; detail: string; completedOn: string }[];
  current: { program: string; status: string; startedOn: string } | null;
};

const EDFARM_RECORDS: Readonly<Record<string, EdFarmRecord>> = Object.freeze({
  "brahma@student.demo": {
    cohort: "Fall 2026 cohort",
    completed: [
      { title: "Swift Fundamentals", detail: "Pathways module", completedOn: "2026-09-26" },
      {
        title: "Career Readiness: Professional Communication",
        detail: "Career readiness workshop",
        completedOn: "2026-10-17",
      },
    ],
    current: { program: "iOS App Development, Pathways", status: "In progress", startedOn: "2026-10-05" },
  },
  "maya@student.demo": {
    cohort: "Summer 2026 cohort",
    completed: [
      { title: "QA Testing Workshop", detail: "Hands-on workshop", completedOn: "2026-07-18" },
      { title: "Accessibility Basics Workshop", detail: "Hands-on workshop", completedOn: "2026-08-08" },
    ],
    current: null,
  },
  "devon@student.demo": {
    cohort: "Fall 2026 cohort",
    completed: [{ title: "Git and GitHub Essentials", detail: "Pathways module", completedOn: "2026-09-12" }],
    current: { program: "Web Development Bootcamp", status: "In progress", startedOn: "2026-10-01" },
  },
});

export function findEdFarmRecord(email: string | null | undefined): EdFarmRecord | null {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(EDFARM_RECORDS, key) ? EDFARM_RECORDS[key] : null;
}
