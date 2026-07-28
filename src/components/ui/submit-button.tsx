"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  ButtonLabel,
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./button";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * Submit button that wires its own loading state.
 *
 * useFormStatus reads the pending state of the nearest enclosing form, so this
 * works for any `<form action={...}>` without the parent threading a prop
 * down, and it keeps working when the parent has no useActionState at all
 * (logout, Google sign-in).
 *
 * aria-disabled rather than disabled: a disabled button leaves the tab order,
 * so a keyboard or screen reader user who just pressed it loses their place
 * and hears nothing about why. This stays focusable and announced as busy;
 * the click guard is what actually prevents the second submit.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (pending) event.preventDefault();
      }}
      className={`${buttonClasses(variant, size)} ${className}`}
    >
      <ButtonLabel pending={pending} pendingLabel={pendingLabel}>
        {children}
      </ButtonLabel>
    </button>
  );
}
