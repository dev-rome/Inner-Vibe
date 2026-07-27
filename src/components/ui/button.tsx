import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

const base = [
  "ease-standard inline-flex items-center justify-center gap-2",
  "rounded-md border font-medium transition-colors duration-150",
  // Padding in rem via the spacing scale, so the control grows with the
  // reader's font size instead of trapping larger text in a fixed box.
  "px-5 py-2.5",
  // aria-disabled rather than :disabled, see SubmitButton for why.
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

const variants: Record<ButtonVariant, string> = {
  // Pressed darkens the border rather than the fill: accent-pressed carries
  // ink at 4.39:1, just under AA, so it never sits behind text. The border is
  // always present and transparent, so colouring it causes no layout shift.
  primary: [
    "border-transparent bg-accent text-accent-ink",
    "hover:bg-accent-hover active:border-accent-pressed",
  ].join(" "),
  secondary: [
    "border-field bg-surface-raised text-ink",
    "hover:bg-surface-sunken active:border-ink",
  ].join(" "),
};

export function buttonClasses(variant: ButtonVariant = "primary") {
  return `${base} ${variants[variant]}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant)} ${className}`}
      {...props}
    />
  );
}

/**
 * A spinner sized in em so it matches whatever text sits next to it.
 *
 * The global reduced-motion rule caps animation-iteration-count at 1, so this
 * settles instead of flickering. The pending label carries the meaning either
 * way; the spinner is decoration and is hidden from assistive tech.
 */
export function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-[1em] w-[1em] animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ButtonLabel({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  return pending ? (
    <>
      <Spinner />
      {pendingLabel}
    </>
  ) : (
    <>{children}</>
  );
}
