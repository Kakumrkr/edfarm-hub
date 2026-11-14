"use client";

import { useActionState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { complete, markDone, reportOrg, updateSummary } from "@/server/actions/application";
import type { FormState } from "@/server/actions/auth";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { StarsInput } from "@/components/ui/stars";
import { SubmitButton } from "@/components/ui/submit-button";

function FormMessage({ state, success }: { state: FormState; success?: string }) {
  if (state?.error)
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  if (state?.ok && success)
    return (
      <p role="status" className="inline-flex items-center gap-1 text-sm text-emerald-700">
        <CheckCircle2 className="size-4" aria-hidden /> {success}
      </p>
    );
  return null;
}

const summaryHint = "What we did and how. 20 to 400 characters. Shows on your public profile.";

/** R10: "We're done" with a summary (IN_PROGRESS, not yet requested). */
export function DoneForm({ appId }: { appId: string }) {
  const [state, action] = useActionState<FormState, FormData>(markDone.bind(null, appId), null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Summary of the work" htmlFor={`summary-${appId}`} hint={summaryHint}>
        <Textarea id={`summary-${appId}`} name="summary" rows={3} minLength={20} maxLength={400} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="sm" pendingText="Saving">
        We&apos;re done
      </SubmitButton>
    </form>
  );
}

/** R10: edit the summary afterward (IN_PROGRESS or COMPLETED). */
export function SummaryEditForm({ appId, summary }: { appId: string; summary: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateSummary.bind(null, appId), null);
  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-emerald-700 hover:text-emerald-800">
        Edit summary
      </summary>
      <form action={action} className="mt-3 space-y-3">
        <Field label="Summary of the work" htmlFor={`edit-${appId}`} hint={summaryHint}>
          <Textarea
            id={`edit-${appId}`}
            name="summary"
            rows={3}
            minLength={20}
            maxLength={400}
            required
            defaultValue={summary}
          />
        </Field>
        <FormMessage state={state} success="Summary saved." />
        <SubmitButton size="sm" variant="secondary" pendingText="Saving">
          Save summary
        </SubmitButton>
      </form>
    </details>
  );
}

/** R11: org marks work completed with optional stars + review. */
export function CompleteForm({ appId }: { appId: string }) {
  const [state, action] = useActionState<FormState, FormData>(complete.bind(null, appId), null);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-stone-800">Rating (optional)</p>
        <StarsInput />
      </div>
      <Field
        label="Review (optional)"
        htmlFor={`review-${appId}`}
        hint="Public on each member's profile. 600 characters max."
      >
        <Textarea id={`review-${appId}`} name="review" rows={3} maxLength={600} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingText="Completing">Mark completed</SubmitButton>
    </form>
  );
}

/** R14: student reports a problem with the org. */
export function ReportForm({ appId }: { appId: string }) {
  const [state, action] = useActionState<FormState, FormData>(reportOrg.bind(null, appId), null);
  if (state?.ok)
    return (
      <p role="status" className="inline-flex items-center gap-1 text-sm text-stone-600">
        <CheckCircle2 className="size-4 text-emerald-700" aria-hidden /> Report sent to Ed Farm staff.
      </p>
    );
  return (
    <details>
      <summary className="inline-flex cursor-pointer items-center gap-1 text-sm text-stone-500 hover:text-red-600">
        <Flag className="size-3.5" aria-hidden /> Report a problem
      </summary>
      <form action={action} className="mt-3 space-y-3">
        <Field
          label="What went wrong?"
          htmlFor={`reason-${appId}`}
          hint="Only Ed Farm staff see this. 10 to 500 characters."
        >
          <Textarea id={`reason-${appId}`} name="reason" rows={3} minLength={10} maxLength={500} required />
        </Field>
        <FormMessage state={state} />
        <SubmitButton size="sm" variant="danger" pendingText="Sending">
          Send report
        </SubmitButton>
      </form>
    </details>
  );
}
