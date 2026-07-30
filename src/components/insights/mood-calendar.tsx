import Link from "next/link";
import type { DayMood } from "@/lib/data/insights";
import { moodForRating } from "@/lib/moods";
import { MAX_RATING, MIN_RATING } from "@/lib/validation/entry";

/** Each tile waits this much longer than the one before it. */
const WAVE_STEP_MS = 12;

/** Monday first, matching the en-GB formatting used everywhere else. */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type MoodCalendarProps = {
  days: DayMood[];
  /** Every date in the range, so gaps stay gaps. */
  dates: string[];
  baseDelayMs?: number;
};

/**
 * Intensity, never hue.
 *
 * A tile is one colour at a strength set by the day's average. A green-to-red
 * scale would have the app grading feelings, and a low mood is not a failure to
 * be coloured like one. One hue cannot pass that judgement however dark it
 * goes: it can only say "more" or "less".
 *
 * The floor of 0.12 keeps a logged day visible. "Logged, and felt low" must not
 * look identical to "did not log", or the grid quietly erases hard days.
 *
 * Strength alone would be signalling by colour, so every tile also carries the
 * emoji and an accessible name that says the mood in words.
 */
function intensity(average: number): number {
  const position = (average - MIN_RATING) / (MAX_RATING - MIN_RATING);
  return 0.12 + position * 0.68;
}

/** Parsed as UTC: these dates were already resolved in the reader's zone. */
function asUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function MoodCalendar({
  days,
  dates,
  baseDelayMs = 0,
}: MoodCalendarProps) {
  const byDate = new Map(days.map((day) => [day.date, day]));

  // Blank cells so every column is one weekday. Without them the grid is a
  // strip of tiles in rows of seven, which cannot show a weekend pattern.
  const lead = dates.length > 0 ? (asUtc(dates[0]).getUTCDay() + 6) % 7 : 0;

  return (
    /*
     * Capped, not fluid. The tiles are aspect-square, so a full-width grid on a
     * wide card makes each day an 85px block and the month reads as a wall
     * rather than as a texture. Around 40px is where the pattern becomes
     * something you take in at a glance.
     */
    <div className="w-full max-w-80">
      <div
        className="text-subtle grid grid-cols-7 gap-1.5 text-center text-xs"
        aria-hidden="true"
      >
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <ol className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: lead }, (_, index) => (
          <li key={`lead-${index}`} aria-hidden="true" />
        ))}
        {dates.map((date, index) => (
          <li key={date}>
            <DayTile
              date={date}
              day={byDate.get(date)}
              delayMs={baseDelayMs + index * WAVE_STEP_MS}
            />
          </li>
        ))}
      </ol>

      {/* Intensity is meaningless without its ends named. aria-hidden because
          every tile already says its mood in words. */}
      <div
        aria-hidden="true"
        className="text-subtle mt-3 flex items-center justify-end gap-1.5 text-xs"
      >
        lower
        {[0.14, 0.34, 0.55, 0.78].map((step) => (
          <span
            key={step}
            className="border-line size-3 rounded-sm border"
            style={{
              backgroundColor: `color-mix(in srgb, var(--color-accent) ${Math.round(
                step * 100,
              )}%, var(--color-surface-raised))`,
            }}
          />
        ))}
        higher
      </div>
    </div>
  );
}

const tileShell =
  "reveal-wave flex aspect-square w-full items-center justify-center rounded-md border text-lg";

function DayTile({
  date,
  day,
  delayMs,
}: {
  date: string;
  day: DayMood | undefined;
  delayMs: number;
}) {
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(asUtc(date));

  const style = { animationDelay: `${delayMs}ms` };

  if (!day) {
    return (
      <div
        // Named rather than left silent, so a screen reader hears the gap.
        role="img"
        aria-label={`${label}: nothing logged`}
        className={`${tileShell} border-line bg-surface-sunken`}
        style={style}
      />
    );
  }

  const mood = moodForRating(Math.round(day.average));
  const entries = day.count === 1 ? "1 entry" : `${day.count} entries`;
  const description = `${label}: ${mood?.label ?? "logged"}, ${entries}`;

  // One entry opens that entry. Several have no single entry to open, so the
  // day opens the journal filtered to it instead.
  const href = day.entryId
    ? `/dashboard/journal/${day.entryId}`
    : `/dashboard/journal?from=${date}&to=${date}`;

  return (
    <Link
      href={href}
      aria-label={description}
      title={description}
      className={`${tileShell} border-line-strong hover:border-ink ease-standard transition-colors duration-150`}
      style={{
        ...style,
        // Single hue at varying strength. color-mix keeps this tied to the one
        // token rather than six hard-coded tints that could drift.
        backgroundColor: `color-mix(in srgb, var(--color-accent) ${Math.round(
          intensity(day.average) * 100,
        )}%, var(--color-surface-raised))`,
      }}
    >
      <span aria-hidden="true">{mood?.emoji}</span>
    </Link>
  );
}
