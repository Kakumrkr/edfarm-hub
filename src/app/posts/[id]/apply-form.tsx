"use client";

import { useActionState } from "react";
import { apply } from "@/server/actions/application";
import type { FormState } from "@/server/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function ApplyForm({ postId, seatsLeft }: { postId: string; seatsLeft: number }) {
  const [state, action] = useActionState<FormState, FormData>(apply.bind(null, postId), null);
  return (
    <form action={action} className="space-y-4">
      <Field label="Note to the organization" htmlFor="note" hint="Optional. Why you're a fit, your availability. 500 characters max.">
        <Textarea id="note" name="note" maxLength={500} rows={3} />
      </Field>
      <Field
        label="Teammate email"
        htmlFor="teammateEmail"
        hint={
          seatsLeft >= 2
            ? "Optional. One Ed Farm student with a resume. A team uses 2 seats."
            : "Only 1 seat left, so apply alone."
        }
      >
        <Input
          id="teammateEmail"
          name="teammateEmail"
          type="email"
          placeholder="teammate@example.com"
          disabled={seatsLeft < 2}
        />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full sm:w-auto" pendingText="Sending">
        Apply
      </SubmitButton>
    </form>
  );
}
