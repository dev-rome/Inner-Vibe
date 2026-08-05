import type { ReactNode } from "react";
import { Card, type CardTone } from "@/components/ui/card";

/**
 * A titled card for the dashboard grid.
 *
 * The eyebrow and the title are two type steps rather than one, which is what
 * lets a row of cards read as a hierarchy instead of a list. The tone carries
 * the difference in weight: the check-in is the page's one hero, everything
 * else supports it, and the date card recedes entirely.
 */
type DashboardCardProps = {
  /** Small uppercase label above the title. */
  eyebrow: string;
  title: string;
  description?: string;
  /** Right-hand slot on the title row: a link, usually. */
  action?: ReactNode;
  tone?: CardTone;
  className?: string;
  /** Anchor target, so the nav's "Log a moment" can scroll to this card. */
  id?: string;
  /**
   * Where this card sits in the page's arrival.
   *
   * Set here rather than on a wrapper because the card is a grid item: a div
   * around it would take the column span and leave the card at one column.
   */
  delayMs?: number;
  children: ReactNode;
};

export function DashboardCard({
  eyebrow,
  title,
  description,
  action,
  tone = "default",
  className = "",
  id,
  delayMs,
  children,
}: DashboardCardProps) {
  const headingId = `card-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    <Card
      as="section"
      id={id}
      tone={tone}
      aria-labelledby={headingId}
      style={
        delayMs === undefined ? undefined : { animationDelay: `${delayMs}ms` }
      }
      className={`flex scroll-mt-6 flex-col ${delayMs === undefined ? "" : "reveal-rise"} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-subtle text-xs font-medium tracking-wider uppercase">
            {eyebrow}
          </p>
          <h2 id={headingId} className="text-ink mt-0.5 text-lg">
            {title}
          </h2>
          {description && (
            <p className="text-subtle mt-1 text-xs">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* No flex-1. Making the body fill the card forces the card to fill its
          grid row, which is what makes a short card as tall as a long one. */}
      <div className="mt-4">{children}</div>
    </Card>
  );
}
