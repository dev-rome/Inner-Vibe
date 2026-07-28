"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import {
  ButtonLabel,
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./button";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & {
  /** Shown and announced while the enclosing form is in flight. */
  pendingLabel: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Reads pending from useFormStatus, so it works for any `<form action>`
 * without the parent threading a prop down.
 *
 * Pending sets aria-disabled, not disabled: a disabled button leaves the tab
 * order, so a keyboard user who just pressed it loses focus and hears nothing.
 * The click guard is what blocks a second submit. Native `disabled` still
 * works for a genuinely inert button.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={`${buttonClasses(variant, size)} ${className}`}
      {...props}
    >
      <ButtonLabel pending={pending} pendingLabel={pendingLabel}>
        {children}
      </ButtonLabel>
    </button>
  );
}
