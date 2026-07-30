import { Card } from "@/components/ui/card";
import { moodForRating } from "@/lib/moods";
import { MAX_RATING } from "@/lib/validation/entry";
// One floor, in one place. The card and the insight card have to refuse on the
// same evidence, or the page contradicts itself: a comparison the bars decline
// to draw must not turn up as a sentence beside them.
import { MIN_SAMPLE } from "@/lib/insights-copy";

export type FactorRow = {
  key: string;
  label: string;
  average: number;
  count: number;
};

type FactorCardProps = {
  title: string;
  /** How the reader should read the comparison, in plain words. */
  caption: string;
  rows: FactorRow[];
  /** Milliseconds this card waits before revealing, for the stagger. */
  delayMs?: number;
};

export function FactorCard({
  title,
  caption,
  rows,
  delayMs = 0,
}: FactorCardProps) {
  const comparable = rows.filter((row) => row.count >= MIN_SAMPLE);
  const canCompare = comparable.length >= 2;

  // Only meaningful once there are two sides to compare. Marking a "best" of
  // one is just pointing at the only thing on screen.
  const best = canCompare
    ? comparable.reduce((a, b) => (b.average > a.average ? b : a))
    : null;

  return (
    <Card
      as="li"
      className="reveal-rise"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <h3 className="text-ink text-base font-medium">{title}</h3>
      <p className="text-subtle mt-1 text-xs">{caption}</p>

      {rows.length === 0 ? (
        <p className="text-subtle mt-4 text-sm">
          Nothing recorded for this yet.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <FactorRowItem
              key={row.key}
              row={row}
              isBest={best?.key === row.key}
            />
          ))}
        </ul>
      )}

      {rows.length > 0 && !canCompare && (
        <p className="text-subtle mt-4 text-xs">
          A few more entries and these become worth comparing.
        </p>
      )}
    </Card>
  );
}

function FactorRowItem({ row, isBest }: { row: FactorRow; isBest: boolean }) {
  const mood = moodForRating(Math.round(row.average));
  // Bar length is proportional to the scale, not to the other row, so a small
  // difference looks small rather than being stretched to fill the card.
  const fraction = row.average / MAX_RATING;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink text-sm">
          {row.label}
          {isBest && (
            // The one place the accent is allowed here: it marks the higher
            // outcome, never the mood ratings themselves.
            <span className="text-accent-strong ml-2 text-xs font-medium">
              higher
            </span>
          )}
        </span>
        <span className="text-muted flex items-center gap-1.5 text-sm">
          <span aria-hidden="true">{mood?.emoji}</span>
          <span className="font-mono tabular-nums">
            {row.average.toFixed(1)}
          </span>
        </span>
      </div>

      <div
        className="bg-surface-sunken mt-1.5 h-1.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${row.label}: average ${row.average.toFixed(1)} out of ${MAX_RATING}, from ${row.count} ${row.count === 1 ? "entry" : "entries"}`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
            isBest ? "bg-accent" : "bg-chart"
          }`}
          style={{ width: `${Math.round(fraction * 100)}%` }}
        />
      </div>

      <p className="text-subtle mt-1 text-xs">
        {row.count} {row.count === 1 ? "entry" : "entries"}
        {row.count < MIN_SAMPLE && " — too few to compare"}
      </p>
    </li>
  );
}
