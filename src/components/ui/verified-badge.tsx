import { ShieldCheck } from "lucide-react";
import { cn } from "./cn";

/** The trust mark. Used on achievements, approved orgs and completed work. */
export function VerifiedBadge({ label = "Verified by Ed Farm", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-50 py-0.5 pr-2.5 pl-1.5 text-xs font-medium whitespace-nowrap text-emerald-800 ring-1 ring-emerald-600/30 ring-inset",
        className,
      )}
    >
      <ShieldCheck className="size-3.5 text-emerald-700" aria-hidden />
      {label}
    </span>
  );
}
