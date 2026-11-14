import { FlaskConical } from "lucide-react";
import { DEMO_MODE } from "@/lib/config";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 sm:text-sm">
      <FlaskConical className="mr-1.5 -mt-0.5 inline size-4" aria-hidden />
      Demo with sample data. Hackathon prototype, not an official Ed Farm product.
    </div>
  );
}
