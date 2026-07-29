export const DEFAULT_TIME_ZONE = "UTC";

/** Every IANA zone this runtime knows, for validating a stored preference. */
export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const PARTS = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
} as const;

/**
 * How far the given zone is from UTC at that instant, in milliseconds.
 *
 * Derived by formatting the instant in the zone and reading the wall clock
 * back, because there is no API that just hands you an offset, and a fixed
 * table would be wrong twice a year.
 */
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    ...PARTS,
  }).formatToParts(instant);

  const read: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") read[part.type] = Number(part.value);
  }

  const wallClock = Date.UTC(
    read.year,
    read.month - 1,
    read.day,
    // Intl renders midnight as 24 in some locales under hour12: false.
    read.hour % 24,
    read.minute,
    read.second,
  );

  return wallClock - instant.getTime();
}

/**
 * The instant a calendar day starts in a zone.
 *
 * Two passes on purpose. The first guesses using the offset at UTC midnight;
 * if that guess lands on the other side of a daylight-saving change the offset
 * differs there, so the second pass corrects it. One pass is wrong for roughly
 * two days a year in every observing zone, which is exactly the kind of bug
 * that surfaces as "my entries moved" months after it ships.
 */
export function startOfDay(isoDate: string, timeZone: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const midnightUtc = Date.UTC(year, month - 1, day);

  const firstGuess = new Date(
    midnightUtc - offsetMs(new Date(midnightUtc), timeZone),
  );
  const corrected = midnightUtc - offsetMs(firstGuess, timeZone);

  return new Date(corrected);
}

/** Exclusive upper bound, so a range query is `>= start` and `< end`. */
export function endOfDay(isoDate: string, timeZone: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));

  return startOfDay(toIsoDate(next), timeZone);
}

/** The calendar date an instant falls on, in the given zone. */
export function toZonedIsoDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const read: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") read[part.type] = part.value;
  }

  return `${read.year}-${read.month}-${read.day}`;
}

function toIsoDate(utcMidnight: Date): string {
  return utcMidnight.toISOString().slice(0, 10);
}
