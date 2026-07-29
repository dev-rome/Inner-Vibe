import { endOfDay, startOfDay, toZonedIsoDate } from "./time-zone";

export const RANGES = ["week", "month", "year"] as const;
export type Range = (typeof RANGES)[number];

export const DEFAULT_RANGE: Range = "week";

export function isRange(value: unknown): value is Range {
  return typeof value === "string" && RANGES.includes(value as Range);
}

const DAYS: Record<Range, number> = { week: 7, month: 30, year: 365 };

/** A year of daily points hides the trend it exists to show. */
export function bucketFor(range: Range): "day" | "week" {
  return range === "year" ? "week" : "day";
}

export type RangeWindow = {
  /** Inclusive lower bound, as an instant. */
  from: Date;
  /** Exclusive upper bound: the first instant of tomorrow. */
  to: Date;
  /** Local calendar dates, for building an empty grid with no gaps. */
  fromDate: string;
  toDate: string;
  days: number;
};

/**
 * A rolling window ending today, resolved in the user's zone.
 *
 * Rolling rather than calendar periods: "this week" is nearly empty on a
 * Monday morning, which reads as broken rather than new, and the week view is
 * the one people open daily.
 *
 * The bounds are day boundaries rather than an exact 7×24h offset, so an entry
 * logged earlier today always falls inside the window regardless of the hour.
 */
export function resolveRange(
  range: Range,
  timeZone: string,
  now: Date = new Date(),
): RangeWindow {
  const days = DAYS[range];
  const toDate = toZonedIsoDate(now, timeZone);

  // Step back through calendar dates rather than subtracting milliseconds, so
  // a daylight-saving change inside the window cannot shift the start by an
  // hour and drop or duplicate a day.
  const end = endOfDay(toDate, timeZone);
  const startGuess = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const fromDate = toZonedIsoDate(startGuess, timeZone);

  return {
    from: startOfDay(fromDate, timeZone),
    to: end,
    fromDate,
    toDate,
    days,
  };
}

/**
 * Every calendar date in the window, oldest first.
 *
 * The aggregate only returns days that have entries, so the UI needs the full
 * span to render gaps as gaps rather than closing them up.
 */
export function datesInWindow(window: RangeWindow, timeZone: string): string[] {
  const out: string[] = [];
  let cursor = startOfDay(window.fromDate, timeZone);
  const limit = window.to.getTime();

  while (cursor.getTime() < limit) {
    const date = toZonedIsoDate(cursor, timeZone);
    out.push(date);
    // Advance by asking for the next calendar day rather than adding 24 hours,
    // which would drift across a transition.
    cursor = endOfDay(date, timeZone);
  }

  return out;
}
