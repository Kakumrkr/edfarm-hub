"use client";

import { useActionState } from "react";
import { registerOrg, type FormState } from "@/server/actions/auth";
import { ORG_TYPES } from "@/lib/constants";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function OrgRegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(registerOrg, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organization name" htmlFor="name">
          <Input id="name" name="name" required maxLength={100} />
        </Field>
        <Field label="Type" htmlFor="type">
          <Select id="type" name="type" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {Object.entries(ORG_TYPES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Website" htmlFor="website" hint="For example https://yourorg.com">
          <Input id="website" name="website" required placeholder="https://" />
        </Field>
        <Field label="Contact name" htmlFor="contactName">
          <Input id="contactName" name="contactName" required autoComplete="name" />
        </Field>
      </div>
      <Field label="What does your organization do?" htmlFor="description" hint="20 characters or more.">
        <Textarea id="description" name="description" required minLength={20} maxLength={1000} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full sm:w-auto" pendingText="Creating account">
        Submit for review
      </SubmitButton>
    </form>
  );
}
