import Link from "next/link";
import { Building2, ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import { APP_NAME, DEMO_MODE } from "@/lib/config";
import { ORG_TYPES, type OrgType } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getLandingStats } from "@/server/queries";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Stars } from "@/components/ui/stars";
import { VerifiedBadge } from "@/components/ui/verified-badge";

// Counts come from the live DB, so never prerender at build time.
export const dynamic = "force-dynamic";

const STEPS = [
  {
    icon: Building2,
    title: "Ed Farm verifies orgs",
    body: "Birmingham startups and nonprofits register. Ed Farm staff check each one before it can post a project.",
  },
  {
    icon: Users,
    title: "Learners take real projects",
    body: "Ed Farm learners apply alone or with one teammate, then work with the org over email.",
  },
  {
    icon: ClipboardCheck,
    title: "Finished work becomes a track record",
    body: "The org confirms the work and leaves a review. It shows on every team member's public profile.",
  },
];

export default async function Home() {
  const { orgs, completed, students, latest } = await getLandingStats();

  return (
    <div className="space-y-20">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-stone-900 sm:text-5xl">
            Real projects. Verified by Ed Farm.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
            {APP_NAME} matches Ed Farm learners with Birmingham startups and nonprofits for small tech jobs like app
            testing, accessibility audits and website fixes. Every finished project becomes proof a learner can show
            the next employer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register/student">Join as an Ed Farm learner</ButtonLink>
            <ButtonLink href="/register/org" variant="secondary">
              Post a project for your org
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            Have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Log in
            </Link>
          </p>
        </div>

        {/* The memorable thing: a real record from the DB, the way it appears on a profile */}
        {latest ? (
          <figure className="relative mr-3 mb-3">
            <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-stone-200 bg-white/60" />
            <div className="relative rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <VerifiedBadge />
                <time className="text-sm text-stone-500">{formatDate(latest.completedAt)}</time>
              </div>
              <p className="mt-4 text-sm text-stone-500">
                {latest.post.org.name}, {ORG_TYPES[latest.post.org.type as OrgType] ?? latest.post.org.type}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-balance">{latest.post.title}</p>
              {latest.rating != null && <Stars value={latest.rating} className="mt-3" />}
              <blockquote className="mt-3 border-l-2 border-amber-300 pl-4 leading-relaxed text-stone-800">
                “{latest.review}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-stone-100 pt-4">
                <InitialsAvatar name={latest.student.user.name} size="sm" />
                <div className="min-w-0 text-sm">
                  <Link
                    href={`/s/${latest.student.id}`}
                    className="font-medium text-stone-900 hover:text-emerald-800"
                  >
                    {latest.student.user.name}
                  </Link>
                  {latest.teammate && <span className="text-stone-500"> and {latest.teammate.user.name}</span>}
                  <p className="text-stone-500">Ed Farm learner{latest.teammate ? "s" : ""}</p>
                </div>
              </figcaption>
            </div>
          </figure>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center text-stone-500">
            <ShieldCheck className="mx-auto mb-2 size-6 text-emerald-700" aria-hidden />
            The first verified project will show here.
          </div>
        )}
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 md:flex-col">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-700 font-semibold text-white tabular-nums">
                {i + 1}
              </span>
              <div>
                <p className="flex items-center gap-2 font-semibold text-stone-900">
                  <s.icon className="size-4 text-emerald-700" aria-hidden />
                  {s.title}
                </p>
                <p className="mt-1 leading-relaxed text-stone-600">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="counts">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="counts" className="text-2xl font-semibold tracking-tight">
            On {APP_NAME} today
          </h2>
          {DEMO_MODE && <Badge tone="amber">Sample data</Badge>}
        </div>
        <dl className="mt-5 grid grid-cols-3 divide-x divide-stone-200 rounded-2xl border border-stone-200 bg-white shadow-sm">
          {[
            { label: "Approved orgs", value: orgs },
            { label: "Completed projects", value: completed },
            { label: "Ed Farm learners", value: students },
          ].map((c) => (
            <div key={c.label} className="flex flex-col-reverse px-3 py-5 sm:px-6">
              <dt className="mt-1 text-sm text-stone-500">{c.label}</dt>
              <dd className="text-3xl font-semibold tracking-tight tabular-nums">{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-stone-200 pt-6 text-sm text-stone-500">
        Hackathon prototype, not an official Ed Farm product.
      </footer>
    </div>
  );
}
