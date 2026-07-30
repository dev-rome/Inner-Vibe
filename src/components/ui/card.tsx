import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/*
 * Surface, border colour and shadow all live on the tone rather than here.
 *
 * Nothing that a tone might override belongs in the base. A caller passing
 * `bg-ink` on top of a base `bg-surface-raised` leaves two background
 * utilities whose winner depends on the order Tailwind emitted them, not the
 * order they were written — so it works or fails by accident.
 */
const cardBase = "rounded-lg border";

/**
 * How present a card is.
 *
 * Set here rather than by passing overriding classes: surface, border colour
 * and shadow are three properties that have to move together, and a caller
 * adding `border-line-strong` on top of the base `border-line` leaves two
 * border-colour utilities whose winner depends on CSS order, not class order.
 */
const TONES = {
  default: "bg-surface-raised border-line shadow-sm",
  /** One per page. The thing the page is for. */
  hero: "bg-surface-raised border-line-strong shadow-md",
  /** Recedes: context rather than content. */
  quiet: "bg-surface-sunken border-line",
  /** The one dark surface, for a card that remarks rather than reports. */
  inverted: "bg-ink border-ink shadow-md",
} as const;

export type CardTone = keyof typeof TONES;

// WithoutRef, because a div ref and an li ref are not interchangeable.
type CardProps = ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "li" | "section";
  tone?: CardTone;
};

export function Card({
  as = "div",
  tone = "default",
  className = "",
  ...props
}: CardProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={`${cardBase} ${TONES[tone]} p-4 sm:p-6 ${className}`}
      {...props}
    />
  );
}

// Dashed, so it reads as a placeholder rather than as content.
export function EmptyState({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${cardBase} border-line-strong border-dashed px-6 py-10 text-center ${className}`}
    >
      {children}
    </div>
  );
}
