import type { ExerciseComparison, SleepComparison } from "@/lib/data/insights";
import { SLEEP_BUCKET_LABELS, SLEEP_BUCKETS } from "@/lib/data/insights";
import { FactorCard, type FactorRow } from "./factor-card";

/** Each card waits this much longer than the one before it. */
const STAGGER_MS = 80;

type FactorCardsProps = {
  exercise: ExerciseComparison[];
  sleep: SleepComparison[];
  baseDelayMs?: number;
};

export function FactorCards({
  exercise,
  sleep,
  baseDelayMs = 0,
}: FactorCardsProps) {
  const exerciseRows: FactorRow[] = exercise.map((row) => ({
    key: String(row.exercised),
    label: row.exercised ? "Days you moved" : "Days you did not",
    average: row.average,
    count: row.count,
  }));

  // Ordered by the bucket list rather than by what came back, so the bands
  // always read low to high even when one of them is empty.
  const sleepRows: FactorRow[] = SLEEP_BUCKETS.flatMap((bucket) => {
    const row = sleep.find((candidate) => candidate.bucket === bucket);
    return row
      ? [
          {
            key: bucket,
            label: SLEEP_BUCKET_LABELS[bucket],
            average: row.average,
            count: row.count,
          },
        ]
      : [];
  });

  return (
    /*
     * A container query, not a viewport one.
     *
     * These sit in a narrow column on a wide desktop, where `sm:grid-cols-2`
     * would still fire — the viewport is wide even though the column is not —
     * and squeeze both cards into a third of the page. Asking the column how
     * much room it has is the only thing that answers the actual question, and
     * it keeps the arrangement the parent's business without a layout prop.
     */
    <div className="@container">
      <ul className="grid gap-4 @lg:grid-cols-2">
        <FactorCard
          title="Moving your body"
          caption="Average mood on days you recorded exercise."
          rows={exerciseRows}
          delayMs={baseDelayMs}
        />
        <FactorCard
          title="Sleep"
          caption="Average mood by how long you slept."
          rows={sleepRows}
          delayMs={baseDelayMs + STAGGER_MS}
        />
      </ul>
    </div>
  );
}
