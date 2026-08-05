import type { Entry } from "@/lib/data/entries";
import { MAX_RATING, MIN_RATING } from "@/lib/validation/entry";

/**
 * The weakest and strongest a mood tint may be, as a percentage of the accent.
 *
 * The floor is not zero: a low day still gets colour, because a mood the app
 * renders as "absent" is a mood the app is quietly grading. Strength varies,
 * hue never does — the same rule the calendar heatmap follows, and the reason
 * a hard day looks softer here rather than redder.
 */
export const TINT_FLOOR = 14;
export const TINT_RANGE = 66;

export function moodTint(rating: number): number {
  const clamped = Math.min(MAX_RATING, Math.max(MIN_RATING, rating));
  const position = (clamped - MIN_RATING) / (MAX_RATING - MIN_RATING);
  return Math.round(TINT_FLOOR + position * TINT_RANGE);
}

export type MonthGroup = {
  /** Stable across renders, for React keys. */
  key: string;
  /** "July 2026", in the reader's own zone. */
  label: string;
  entries: Entry[];
};

/**
 * Split a page of entries into the months they fall in.
 *
 * Grouped in the profile's timezone rather than the server's, so an entry
 * logged late on the last of the month lands in the month the writer was
 * living in, not the one UTC had already moved on to.
 *
 * Order is preserved rather than sorted: the query already returned these
 * newest-first, and re-sorting here would quietly disagree with the cursor
 * that paginates them.
 */
export function groupByMonth(entries: Entry[], timeZone: string): MonthGroup[] {
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    month: "long",
    year: "numeric",
  });

  const groups: MonthGroup[] = [];

  for (const entry of entries) {
    const key = label.format(entry.loggedAt);
    const last = groups.at(-1);

    // Only ever compared with the previous group, so a month that recurs after
    // a gap starts a new heading rather than reopening the earlier one.
    if (last?.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({ key, label: key, entries: [entry] });
    }
  }

  return groups;
}
