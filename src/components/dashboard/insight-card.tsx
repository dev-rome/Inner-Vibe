import { Card } from "@/components/ui/card";
import type { Insight } from "@/lib/insights-copy";

/**
 * The one dark surface on the page.
 *
 * Inverted because it is the only card that says something rather than showing
 * something, and it has to read as a remark rather than as more data. Being the
 * single dark object is what makes it legible as that.
 *
 * It renders even with nothing to report. A card that appears and disappears as
 * evidence crosses a threshold makes the layout twitch, and its absence would
 * be the one thing on the page nobody could ask about.
 */
export function InsightCard({ insight }: { insight: Insight | null }) {
  return (
    <Card
      as="section"
      tone="inverted"
      aria-labelledby="insight-heading"
      className="flex flex-col justify-between gap-6"
    >
      <span
        aria-hidden="true"
        className="bg-accent text-accent-ink flex size-9 items-center justify-center rounded-full"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z" />
        </svg>
      </span>

      <div>
        <h2
          id="insight-heading"
          className="text-surface font-display text-lg font-semibold"
        >
          A gentle pattern
        </h2>

        {insight ? (
          <>
            <p className="text-line-strong mt-2 text-sm">
              {insight.observation}
            </p>
            {/* The hedge sits with the claim, never a tooltip away from it. */}
            <p className="text-subtle mt-3 text-xs">{insight.basis}</p>
          </>
        ) : (
          <p className="text-line-strong mt-2 text-sm">
            Once there are a few more entries, anything that tends to go
            together will show up here.
          </p>
        )}
      </div>
    </Card>
  );
}
