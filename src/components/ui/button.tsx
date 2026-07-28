import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md";

const base = [
  "ease-standard inline-flex items-center justify-center gap-2",
  "rounded-md border font-medium transition-colors duration-150",
  "aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

// sm matches input padding so a button beside a field lines up.
const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-2.5",
};

const variants: Record<ButtonVariant, string> = {
  // Pressed darkens the border, not the fill: accent-pressed carries ink at
  // 4.39:1, so it never sits behind text. The border is always there and
  // transparent, so colouring it shifts nothing.
  primary: [
    "border-transparent bg-accent text-accent-ink",
    "hover:bg-accent-hover active:border-accent-pressed",
  ].join(" "),
  secondary: [
    "border-field bg-surface-raised text-ink",
    "hover:bg-surface-sunken active:border-ink",
  ].join(" "),
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) {
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${buttonClasses(variant, size)} ${className}`}
      {...props}
    />
  );
}

// Sized in em to track adjacent text. The global reduced-motion rule caps
// iterations at 1, so it settles rather than flickering.
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
