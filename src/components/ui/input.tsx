import type { ComponentProps } from "react";

/**
 * Shared field treatment.
 *
 * border-field rather than border-line: WCAG 1.4.11 wants 3:1 for a control's
 * visual boundary, and border-line measures 1.29:1 on white.
 *
 * The invalid state colours the border, not just the message below it. Red
 * text alone leaves the field itself looking untouched, so a user scanning a
 * form has nothing tying the error to the input it belongs to. status-error
 * measures 7.6:1 against the field background, well past the 3:1 a boundary
 * needs. aria-invalid is not one of Tailwind's built-in aria variants, hence
 * the attribute selector.
 *
 * Disabled dims and shifts to the sunken surface so it reads as inert rather
 * than merely empty.
 *
 * Deliberately carries no width, margin or font size. Those differ per usage
 * (w-full here, w-28 for hours slept), and baking one in would mean callers
 * fighting it with a second utility — a conflict Tailwind resolves by CSS
 * order, not class order, so the winner would be effectively arbitrary.
 */
export const fieldClasses = [
  "ease-standard rounded-sm border px-3 py-2 transition-colors duration-150",
  "border-field bg-surface-raised text-ink placeholder:text-subtle",
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
