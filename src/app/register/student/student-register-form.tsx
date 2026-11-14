"use client";

import { useActionState } from "react";
import { registerStudent, type FormState } from "@/server/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function StudentRegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerStudent, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <Input id="name" name="name" required maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Ed Farm cohort" htmlFor="cohort" hint='For example "Fall 2026 cohort"'>
          <Input id="cohort" name="cohort" maxLength={60} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
      </div>
      <Field label="Skills" htmlFor="skills" hint="Comma separated, for example Swift, Manual testing">
        <Input id="skills" name="skills" maxLength={300} />
      </Field>
      <Field label="Short bio" htmlFor="bio" hint="Optional. What you're learning and what you want to work on.">
        <Textarea id="bio" name="bio" maxLength={600} rows={3} />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full sm:w-auto" pendingText="Creating account">
        Create my account
      </SubmitButton>
    </form>
  );
}
