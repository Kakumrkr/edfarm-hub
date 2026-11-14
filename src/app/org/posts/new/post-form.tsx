"use client";

import { useActionState, useState } from "react";
import { createPost } from "@/server/actions/org";
import type { FormState } from "@/server/actions/auth";
import { CATEGORIES, COMP_TYPES, SAFETY_TEXT } from "@/lib/constants";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";

export function PostForm({ orgType }: { orgType: string }) {
  const [state, action] = useActionState<FormState, FormData>(createPost, null);
  const isStartup = orgType === "STARTUP";
  // R3: startups never see Volunteer.
  const compOptions = Object.entries(COMP_TYPES).filter(([v]) => !(isStartup && v === "UNPAID"));
  const [comp, setComp] = useState(isStartup ? "STIPEND" : "UNPAID");

  return (
    <form action={action} className="space-y-4">
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" required minLength={5} maxLength={120} placeholder="Test our iPhone rebooking feature" />
      </Field>
      <Field label="Description" htmlFor="description" hint="What to do, what done looks like, and how you'll work together.">
        <Textarea id="description" name="description" required minLength={30} maxLength={3000} rows={6} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {Object.entries(CATEGORIES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Skills" htmlFor="skills" hint="Comma separated, e.g. iOS, Manual testing">
          <Input id="skills" name="skills" maxLength={300} />
        </Field>
        <Field label="Positions" htmlFor="positions" hint="1 to 5. A team of 2 uses 2 seats.">
          <Input id="positions" name="positions" type="number" min={1} max={5} defaultValue={1} required />
        </Field>
        <Field label="Estimated hours" htmlFor="estimatedHours">
          <Input id="estimatedHours" name="estimatedHours" type="number" min={1} max={200} />
        </Field>
        <Field label="Compensation" htmlFor="compensationType" hint={isStartup ? "Startups offer paid work or a stipend." : undefined}>
          <Select id="compensationType" name="compensationType" value={comp} onChange={(e) => setComp(e.target.value)}>
            {compOptions.map(([v, c]) => (
              <option key={v} value={v}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Compensation note" htmlFor="compensationNote" hint={comp === "UNPAID" ? "Optional" : "Required, e.g. $150 stipend"}>
          <Input id="compensationNote" name="compensationNote" maxLength={120} required={comp !== "UNPAID"} placeholder="$150 stipend" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-800">
        <input type="checkbox" name="beginnerFriendly" className="size-4 accent-emerald-700" />
        Beginner-friendly
      </label>
      <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <input type="checkbox" name="safety" required className="mt-0.5 size-4 shrink-0 accent-emerald-700" />
        {SAFETY_TEXT}
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <SubmitButton className="w-full sm:w-auto" pendingText="Publishing">
        Publish project
      </SubmitButton>
    </form>
  );
}
