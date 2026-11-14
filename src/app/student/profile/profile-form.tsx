"use client";

import { useActionState } from "react";
import { updateProfile } from "@/server/actions/student";
import type { FormState } from "@/server/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ cohort, skills, bio }: { cohort: string; skills: string; bio: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <Field label="Ed Farm cohort" htmlFor="cohort">
        <Input id="cohort" name="cohort" defaultValue={cohort} maxLength={60} />
      </Field>
      <Field label="Skills" htmlFor="skills" hint="Comma separated.">
        <Input id="skills" name="skills" defaultValue={skills} maxLength={300} />
      </Field>
      <Field label="Bio" htmlFor="bio" hint="Up to 600 characters.">
        <Textarea id="bio" name="bio" defaultValue={bio} maxLength={600} rows={4} />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Profile saved.</p>}
      <SubmitButton pendingText="Saving">Save profile</SubmitButton>
    </form>
  );
}
