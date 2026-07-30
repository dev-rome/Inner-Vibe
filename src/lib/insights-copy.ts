import type {
  ExerciseComparison,
  InsightsSummary,
  SleepComparison,
} from "@/lib/data/insights";
import { SLEEP_BUCKET_LABELS } from "@/lib/data/insights";

/**
 * Below this, a comparison reports what it has instead of drawing one.
 *
 * A mean over one or two entries is noise, and presenting it beside another
 * mean invites reading a cause into it. This app records how someone felt and
 * shows them their own data; it does not tell them what it means.
 */
export const MIN_SAMPLE = 3;

/**
 * Two averages this close apart are the same average.
 *
 * Without a floor the card would always find "a pattern", because two groups
 * never tie exactly. Half a point on a six-point scale is the smallest gap
 * worth a sentence.
 */
export const MIN_GAP = 0.5;

/**
 * The quiet line under the greeting.
 *
 * Never evaluates. "You've logged 12 times" is a fact; "you're doing great"
 * would be the app deciding how the week went.
 */
export function contextLine(summary: InsightsSummary): string {
  const { totalEntries, recentEntries } = summary;

  if (totalEntries === 0) {
    return "Your patterns will appear here as you log.";
  }

  if (recentEntries === 0) {
    return "Nothing logged in the last week. Everything earlier is still here.";
  }

  return `You've logged ${recentEntries} ${
    recentEntries === 1 ? "time" : "times"
  } this week.`;
}

export type Insight = {
  observation: string;
  /** Sample size and the hedge, so the claim never floats free of its basis. */
  basis: string;
};

type Candidate = { label: string; average: number; count: number };

/**
 * The strongest gap among the candidates, or nothing.
 *
 * Nothing is a real answer here, and the common one early on. A card that
 * always produces a finding is a card that invents them.
 */
function strongest(rows: Candidate[]): {
  top: Candidate;
  gap: number;
  total: number;
} | null {
  const usable = rows.filter((row) => row.count >= MIN_SAMPLE);
  if (usable.length < 2) return null;

  const sorted = [...usable].sort((a, b) => b.average - a.average);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const gap = top.average - bottom.average;

  if (gap < MIN_GAP) return null;

  return {
    top,
    gap,
    total: usable.reduce((sum, row) => sum + row.count, 0),
  };
}

/**
 * One observation drawn from the factor aggregates.
 *
 * Deliberately describes rather than explains. "Higher on the days you moved"
 * is something the data says; "moving improves your mood" is a causal claim
 * this app has no standing to make, and the person reading it may be unwell.
 * The wording, the sample size and the explicit "not a cause" all exist to keep
 * the difference visible.
 */
export function deriveInsight(
  exercise: ExerciseComparison[],
  sleep: SleepComparison[],
): Insight | null {
  const exerciseResult = strongest(
    exercise.map((row) => ({
      label: row.exercised
        ? "on the days you moved"
        : "on the days you did not exercise",
      average: row.average,
      count: row.count,
    })),
  );

  const sleepResult = strongest(
    sleep.map((row) => ({
      label: `after ${SLEEP_BUCKET_LABELS[row.bucket].toLowerCase()} of sleep`,
      average: row.average,
      count: row.count,
    })),
  );

  // Whichever gap is wider has more to say. A tie keeps sleep, arbitrarily but
  // consistently, so the card does not flicker between two equal readings.
  const winner =
    exerciseResult && sleepResult
      ? exerciseResult.gap > sleepResult.gap
        ? exerciseResult
        : sleepResult
      : (exerciseResult ?? sleepResult);

  if (!winner) return null;

  return {
    observation: `Your mood has been higher ${winner.top.label}.`,
    basis: `From ${winner.total} ${
      winner.total === 1 ? "entry" : "entries"
    }. A pattern, not a cause.`,
  };
}
