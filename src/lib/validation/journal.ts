import { z } from "zod";
import { MAX_RATING, MIN_RATING } from "./entry";

/** Calendar date, not an instant. The zone comes from the user's profile. */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");

/**
 * A URL is as untrusted as a form body, so the same treatment applies.
 *
 * Everything is optional and unknown values are dropped rather than rejected:
 * a hand-edited or stale link should show an unfiltered journal, not an error
 * page. `catch` turns a malformed value into "absent" per field.
 */
export const journalFiltersSchema = z.object({
  tag: z.uuid().optional().catch(undefined),
  mood: z.coerce
    .number()
    .int()
    .min(MIN_RATING)
    .max(MAX_RATING)
    .optional()
    .catch(undefined),
  from: isoDate.optional().catch(undefined),
  to: isoDate.optional().catch(undefined),
  cursor: z.string().max(80).optional().catch(undefined),
});

export type JournalSearchParams = z.infer<typeof journalFiltersSchema>;

export function parseJournalParams(
  raw: Record<string, string | string[] | undefined>,
): JournalSearchParams {
  // Repeated params (?mood=1&mood=2) arrive as arrays. Take the first rather
  // than failing, since the only way to send one is by hand.
  const single = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );

  const parsed = journalFiltersSchema.safeParse(single);

  // Every field carries its own catch, so a failure here means the object
  // itself was unusable. An empty filter set is the safe reading.
  return parsed.success ? parsed.data : {};
}

/** Swap or clear one filter, keeping the rest. Always resets pagination. */
export function buildJournalHref(
  current: JournalSearchParams,
  change: Partial<Record<"tag" | "mood" | "from" | "to", string | undefined>>,
): string {
  const params = new URLSearchParams();
  const merged: Record<string, string | undefined> = {
    tag: current.tag,
    mood: current.mood === undefined ? undefined : String(current.mood),
    from: current.from,
    to: current.to,
    ...change,
  };

  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }

  // Deliberately no cursor: a cursor from the old filter set points at a row
  // that may not be in the new one, which would silently skip results.
  const query = params.toString();
  return query ? `/dashboard/journal?${query}` : "/dashboard/journal";
}
