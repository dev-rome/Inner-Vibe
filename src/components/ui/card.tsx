import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Surface and shape only. Border colour and padding live on the variants
 * below, because the two treatments disagree on both and merging them would
 * leave callers with conflicting utilities.
 */
const cardBase = "bg-surface-raised rounded-lg border";

// ComponentPropsWithoutRef, not ComponentProps: a div ref and an li ref are
// not interchangeable, so including ref makes the element union unassignable.
// Nothing here needs a ref, and leaving it out keeps the union honest.
type CardProps = ComponentPropsWithoutRef<"div"> & {
  /** Entry lists and the landing page render cards as list items. */
  as?: "div" | "li" | "section";
};

export function Card({ as = "div", className = "", ...props }: CardProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      className={`${cardBase} border-line p-4 sm:p-6 ${className}`}
      {...props}
    />
  );
}

/**
 * The nothing-here-yet state. A dashed border reads as a placeholder rather
 * than as content, which a solid card would not.
 */
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
