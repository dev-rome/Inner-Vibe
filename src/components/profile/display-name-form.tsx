"use client";

import { useActionState, useState } from "react";
import { saveDisplayNameAction } from "@/app/dashboard/profile/actions";
import { initialSettingsFormState } from "@/app/dashboard/profile/form-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/validation/profile";

/**
 * What the app calls you.
 *
 * Controlled rather than uncontrolled, because React 19 resets an uncontrolled
 * form after an action resolves — including when it fails — and a rejected name
 * that vanishes from the field leaves nothing to correct.
 */
export function DisplayNameForm({ current }: { current: string | null }) {
  const [state, formAction] = useActionState(
    saveDisplayNameAction,
    initialSettingsFormState,
  );

  const [value, setValue] = useState(current ?? "");

  // useState reads its argument only on mount, so after a save the server sends
  // the new name down but the field keeps showing the old one. Adjusting during
  // render is React's documented fix for state derived from a prop.
  const [lastSaved, setLastSaved] = useState(current);
  if (current !== lastSaved) {
    setLastSaved(current);
    setValue(current ?? "");
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p
        aria-live="polite"
        className={`min-h-6 text-sm ${
          state.status === "error" ? "text-status-error" : "text-accent-strong"
        }`}
      >
        {state.message}
      </p>

      <div>
        <label
          htmlFor="displayName"
          className="text-ink block text-base font-medium"
        >
          Your name
        </label>
        <p className="text-muted mt-1 text-sm">
          Used to greet you. Leave it blank and the app just says hello.
        </p>

        <Input
          id="displayName"
          name="displayName"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          autoComplete="nickname"
          placeholder="Rome"
          aria-invalid={state.status === "error" || undefined}
          className="mt-3 w-full max-w-xs"
        />
      </div>

      <div>
        <SubmitButton pendingLabel="Saving…">Save name</SubmitButton>
      </div>
    </form>
  );
}
