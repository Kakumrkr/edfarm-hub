import { APP_NAME } from "@/lib/config";
import { ButtonLink } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/ui/verified-badge";

// Placeholder. The full landing page is built in Session 4.
export default function Home() {
  return (
    <section className="mx-auto max-w-2xl py-12 text-center">
      <VerifiedBadge />
      <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Real projects for Ed Farm learners, verified by the people who did the work with them.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-stone-500">
        {APP_NAME} connects Ed Farm students with Birmingham startups and nonprofits for small, real tech projects.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/login">Log in</ButtonLink>
        <ButtonLink href="/register" variant="secondary">
          Create an account
        </ButtonLink>
      </div>
    </section>
  );
}
