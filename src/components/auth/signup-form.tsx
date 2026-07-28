"use client";

import { useActionState } from "react";
import { signup } from "@/app/(auth)/actions";
import { initialAuthFormState } from "@/app/(auth)/form-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation/auth";
import { AuthField } from "./auth-field";

export function SignupForm() {
  const [state, formAction] = useActionState(signup, initialAuthFormState);

  if (state.status === "check-email") {
    return (
      <Card role="status">
        <h2 className="text-ink text-xl">Check your inbox</h2>
        <p className="text-muted mt-2 text-sm">
          If <span className="text-ink font-medium">{state.email}</span> can be
          used, a confirmation link is on its way. Open it to finish setting up
          your account.
        </p>
      </Card>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        errors={state.fieldErrors.password}
      />

      <SubmitButton pendingLabel="Creating account…" className="mt-2 w-full">
        Create account
      </SubmitButton>
    </form>
  );
}
