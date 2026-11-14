import Link from "next/link";
import { Clock, Search, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORIES, COMP_TYPES, ORG_TYPES, type Category, type OrgType } from "@/lib/constants";
import { csvToList } from "@/lib/format";
import { countSeats } from "@/server/queries";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Select } from "@/components/ui/select";
import { buttonClass } from "@/components/ui/button";

function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : "";
}

export default async function PostsPage({ searchParams }: PageProps<"/posts">) {
  await requireUser(["STUDENT"]);
  const sp = await searchParams;
  const category = one(sp.category) in CATEGORIES ? one(sp.category) : "";
  const comp = one(sp.comp) in COMP_TYPES ? one(sp.comp) : "";
  const beginner = one(sp.beginner) === "1";

  const posts = await prisma.post.findMany({
    where: {
      status: "OPEN",
      org: { status: "APPROVED" },
      ...(category && { category }),
      ...(comp && { compensationType: comp }),
      ...(beginner && { beginnerFriendly: true }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      org: { select: { name: true, type: true } },
      applications: { select: { status: true, teammateId: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Find projects"
        description="Real projects from Birmingham startups and nonprofits approved by Ed Farm."
      />

      <form method="get" className="mb-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
        <Select name="category" defaultValue={category} aria-label="Category">
          <option value="">All categories</option>
          {Object.entries(CATEGORIES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
        <Select name="comp" defaultValue={comp} aria-label="Compensation">
          <option value="">Any compensation</option>
          {Object.entries(COMP_TYPES).map(([v, c]) => (
            <option key={v} value={v}>
              {c.label}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="beginner" value="1" defaultChecked={beginner} className="size-4 accent-emerald-700" />
          Beginner-friendly
        </label>
        <button type="submit" className={buttonClass("secondary")}>
          Filter
        </button>
      </form>

      {posts.length === 0 ? (
        <EmptyState icon={Search} title="No open projects match">
          Try clearing a filter, or check back soon.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {posts.map((p) => {
            const left = Math.max(0, p.positions - countSeats(p.applications));
            const skills = csvToList(p.skills);
            return (
              <li key={p.id}>
                <Link href={`/posts/${p.id}`} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
                  <Card className="h-full transition-colors hover:border-emerald-300">
                    <p className="text-sm font-medium text-emerald-800">
                      {CATEGORIES[p.category as Category] ?? p.category}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-900">{p.title}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-600">
                      <span className="font-medium text-stone-800">{p.org.name}</span>
                      <VerifiedBadge label="Approved" />
                      <span className="text-stone-400">·</span>
                      <span>{ORG_TYPES[p.org.type as OrgType] ?? p.org.type}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge kind="comp" status={p.compensationType} />
                      {p.compensationNote && <Badge>{p.compensationNote}</Badge>}
                      {p.beginnerFriendly && <Badge tone="sky">Beginner-friendly</Badge>}
                    </div>
                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <span key={s} className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-100 pt-3 text-sm text-stone-500">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-4" aria-hidden /> {left} of {p.positions} seats left
                      </span>
                      {p.estimatedHours && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-4" aria-hidden /> {p.estimatedHours} h
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
