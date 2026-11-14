import { notFound } from "next/navigation";
import Link from "next/link";
import { Briefcase, ShieldCheck, Sprout, Users } from "lucide-react";
import { CATEGORIES, ORG_TYPES, type Category, type OrgType } from "@/lib/constants";
import { csvToList, formatDate } from "@/lib/format";
import { getPublicProfile } from "@/server/queries";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Stars } from "@/components/ui/stars";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { CopyLinkButton } from "@/components/copy-link-button";

export async function generateMetadata({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  const p = await getPublicProfile(id);
  return { title: p ? `${p.student.user.name}, verified track record` : "Profile not found" };
}

/** Public trust profile. R16: no email, no resume, no declined/withdrawn/cancelled work. */
export default async function PublicProfilePage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  const profile = await getPublicProfile(id);
  if (!profile) notFound();
  const { student, current, completed, stats } = profile;
  const skills = csvToList(student.skills);
  const name = student.user.name;

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <InitialsAvatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{name}</h1>
              <p className="mt-1 text-stone-500">Ed Farm learner{student.cohort ? `, ${student.cohort}` : ""}</p>
            </div>
            <CopyLinkButton />
          </div>
          {student.bio && <p className="mt-4 max-w-2xl leading-relaxed text-stone-700">{student.bio}</p>}
          {skills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* One ledger strip instead of three stat cards */}
      <dl className="grid grid-cols-3 divide-x divide-stone-200 rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="px-3 py-4 sm:px-6">
          <dt className="text-sm text-stone-500">Completed projects</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{stats.completed}</dd>
        </div>
        <div className="px-3 py-4 sm:px-6">
          <dt className="text-sm text-stone-500">Average rating</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight tabular-nums">
            {stats.avgRating != null ? (
              <>
                {stats.avgRating.toFixed(1)}
                <Stars value={stats.avgRating} className="hidden sm:inline-flex" />
              </>
            ) : (
              <span className="text-base font-normal text-stone-400">No ratings yet</span>
            )}
          </dd>
        </div>
        <div className="px-3 py-4 sm:px-6">
          <dt className="text-sm text-stone-500">Orgs worked with</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{stats.orgs}</dd>
        </div>
      </dl>

      <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
        {/* Completed history is chronological, so it reads as a timeline */}
        <section className="order-2 lg:order-1">
          <CardTitle className="mb-4">Completed work</CardTitle>
          {completed.length === 0 ? (
            <EmptyState icon={Sprout} title="New here. No completed projects yet.">
              Finished projects show up here once the organization confirms them.
            </EmptyState>
          ) : (
            <ol className="space-y-5 border-l-2 border-emerald-100 pl-5 sm:pl-7">
              {completed.map((c) => (
                <li key={c.id} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-7 -left-[1.6rem] size-3 rounded-full bg-emerald-600 ring-4 ring-stone-50 sm:-left-[2.1rem]"
                  />
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-stone-900">
                        {c.post.org.name}
                        <Badge>{ORG_TYPES[c.post.org.type as OrgType] ?? c.post.org.type}</Badge>
                      </p>
                      <time className="text-sm text-stone-500" dateTime={c.completedAt?.toISOString()}>
                        {formatDate(c.completedAt)}
                      </time>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight">{c.post.title}</h3>
                    <p className="text-sm text-stone-500">{CATEGORIES[c.post.category as Category] ?? c.post.category}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <VerifiedBadge label={c.completedBy === "ADMIN" ? "Closed by Ed Farm" : "Verified by Ed Farm"} />
                      {c.rating != null && <Stars value={c.rating} />}
                      {c.partner && (
                        <span className="inline-flex items-center gap-1 text-sm text-stone-600">
                          <Users className="size-4 text-violet-600" aria-hidden />
                          Team project with
                          <Link
                            href={`/s/${c.partner.id}`}
                            className="font-medium text-emerald-700 underline-offset-2 hover:underline"
                          >
                            {c.partner.name}
                          </Link>
                        </span>
                      )}
                    </div>

                    {c.review && (
                      <blockquote className="mt-4 border-l-2 border-amber-300 pl-4 text-stone-800">
                        <p className="leading-relaxed">“{c.review}”</p>
                        <footer className="mt-1 text-sm text-stone-500">{c.post.org.name}</footer>
                      </blockquote>
                    )}
                    {c.studentSummary && (
                      <div className="mt-4 rounded-xl bg-stone-50 px-4 py-3">
                        <p className="text-sm font-medium text-stone-700">What we did</p>
                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-stone-600">
                          {c.studentSummary}
                        </p>
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="order-1 space-y-8 lg:order-2">
          <section>
            <CardTitle className="mb-3">Ed Farm achievements</CardTitle>
            {student.achievements.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-4 py-4 text-sm text-stone-500">
                No verified achievements yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {student.achievements.map((a) => (
                  <li key={a.id} className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden />
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900">{a.title}</p>
                      {a.detail && <p className="text-sm text-stone-600">{a.detail}</p>}
                      <p className="mt-1 text-xs text-emerald-800">Verified by Ed Farm, {formatDate(a.awardedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {current.length > 0 && (
            <section>
              <CardTitle className="mb-3">Working on now</CardTitle>
              <ul className="space-y-2">
                {current.map((c) => (
                  <li key={c.id} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm">
                    <Briefcase className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
                    <p className="text-stone-700">
                      Currently working with <span className="font-medium text-stone-900">{c.post.org.name}</span>
                      <span className="block text-stone-500">{c.post.title}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
