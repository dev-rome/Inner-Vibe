/**
 * "Good evening" has to mean evening where the reader is.
 *
 * The server's clock is irrelevant: it may be in another hemisphere, and in
 * production it is usually UTC, which would greet half the world wrongly. The
 * zone already stored on the profile is the same one that decides which day an
 * entry belongs to, so the greeting and the data agree.
 */
export type PartOfDay = "morning" | "afternoon" | "evening";

/**
 * Boundaries at 5, 12 and 18.
 *
 * The small hours count as evening rather than getting a fourth label. Someone
 * logging at 3am is having a long night, not a new morning, and "Good night"
 * reads as a farewell from an app they just opened.
 */
export function partOfDay(hour: number): PartOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

/** The hour on the wall clock in a zone, 0 to 23. */
export function hourIn(timeZone: string, now: Date = new Date()): number {
  const [hour] = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  })
    .format(now)
    // Some locales render midnight as "24", which is hour 0.
    .split(":");

  return Number(hour) % 24;
}

const OPENERS: Record<PartOfDay, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

/**
 * The greeting, with the name only when there is one.
 *
 * No fallback to the email's local part. "Good evening, info.devrome" is worse
 * than no name at all, and nobody agreed to be addressed by an address.
 */
export function greeting(
  displayName: string | null,
  timeZone: string,
  now: Date = new Date(),
): string {
  const opener = OPENERS[partOfDay(hourIn(timeZone, now))];
  return displayName ? `${opener}, ${displayName}` : opener;
}
