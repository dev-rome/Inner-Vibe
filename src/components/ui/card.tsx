import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

// Border colour and padding live on the variants, which disagree on both.
const cardBase = "bg-surface-raised rounded-lg border";

// WithoutRef, because a div ref and an li ref are not interchangeable.
type CardProps = ComponentPropsWithoutRef<"div"> & {
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
