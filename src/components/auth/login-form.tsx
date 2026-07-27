"use client";

import { useActionState } from "react";
import { login } from "@/app/(auth)/actions";
import { initialAuthFormState } from "@/app/(auth)/form-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { AuthField } from "./auth-field";

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialAuthFormState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* role="alert" so a failed sign-in is announced without the user having
          to go hunting for what changed. */}
      {state.message && (
        <p role="alert" className="text-status-error text-sm">
          {state.message}
        </p>
      )}

      <AuthField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state.email}
        errors={state.fieldErrors.email}
      />

      <AuthField
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        errors={state.fieldErrors.password}
      />

      <SubmitButton pendingLabel="Signing in…" className="mt-2 w-full">
        Log in
      </SubmitButton>
    </form>
  );
}
