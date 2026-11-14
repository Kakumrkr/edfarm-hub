import Link from "next/link";
import { FileText, Mail, UserRound } from "lucide-react";
import { csvToList } from "@/lib/format";
import { Badge } from "./ui/badge";
import { InitialsAvatar } from "./ui/initials-avatar";
import { Stars } from "./ui/stars";
import { VerifiedBadge } from "./ui/verified-badge";

export type Member = {
  id: string;
  cohort: string;
  skills: string;
  resumeName: string | null;
  user: { name: string; email: string };
  achievements: { id: string; title: string }[];
  stats: { completed: number; avgRating: number | null };
};

/** One applicant. Email shows only when showEmail (R8: IN_PROGRESS or COMPLETED). */
export function MemberRow({ m, role, showEmail }: { m: Member; role?: string; showEmail: boolean }) {
  const skills = csvToList(m.skills);
  return (
    <div className="flex gap-3">
      <InitialsAvatar name={m.user.name} />
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-medium text-stone-900">
            {m.user.name}
            {role && <Badge>{role}</Badge>}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
            {m.cohort || "Ed Farm learner"} · {m.stats.completed} completed
            {m.stats.avgRating != null && (
              <span className="inline-flex items-center gap-1">
                <Stars value={m.stats.avgRating} /> {m.stats.avgRating.toFixed(1)}
              </span>
            )}
          </p>
        </div>
        {m.achievements.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {m.achievements.map((a) => (
              <li key={a.id}>
                <VerifiedBadge label={a.title} className="whitespace-normal" />
              </li>
            ))}
          </ul>
        )}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <Link href={`/s/${m.id}`} className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800">
            <UserRound className="size-4" aria-hidden /> Public profile
          </Link>
          {m.resumeName && (
            <a
              href={`/api/resume/${m.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
            >
              <FileText className="size-4" aria-hidden /> Resume
            </a>
          )}
          {showEmail && (
            <a href={`mailto:${m.user.email}`} className="inline-flex min-w-0 items-center gap-1 break-all text-stone-700 hover:text-stone-900">
              <Mail className="size-4 shrink-0" aria-hidden /> {m.user.email}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
