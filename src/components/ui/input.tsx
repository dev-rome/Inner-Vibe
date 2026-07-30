import type { ComponentProps } from "react";

// border-field, not border-line: a control boundary needs 3:1 (WCAG 1.4.11)
// and border-line is 1.29:1 on white.
// No width, margin or font size here — callers differ, and a duplicate utility
// resolves by CSS order rather than class order.
export const fieldClasses = [
  "ease-standard rounded-sm border px-3 py-2 transition-colors duration-hover",
  "border-field bg-surface-raised text-ink placeholder:text-subtle",
  // Colours the field itself, not just the message, so the error is tied to
  // the input. aria-invalid is not a built-in Tailwind variant.
  "aria-[invalid=true]:border-status-error",
  "disabled:bg-surface-sunken disabled:text-muted disabled:cursor-not-allowed",
].join(" ");

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${fieldClasses} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea className={`${fieldClasses} resize-y ${className}`} {...props} />
  );
}
