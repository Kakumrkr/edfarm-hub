import { APP_STATUS, COMP_TYPES, FLAG_STATUS, ORG_STATUS, POST_STATUS, type Tone } from "@/lib/constants";
import { Badge } from "./badge";

const maps: Record<string, Record<string, { label: string; tone: Tone }>> = {
  org: ORG_STATUS,
  post: POST_STATUS,
  app: APP_STATUS,
  comp: COMP_TYPES,
  flag: FLAG_STATUS,
};

export function StatusBadge({ kind, status }: { kind: "org" | "post" | "app" | "comp" | "flag"; status: string }) {
  const entry = maps[kind][status] ?? { label: status, tone: "stone" as const };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
