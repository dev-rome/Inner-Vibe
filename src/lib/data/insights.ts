import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data/session";
import { failRead } from "@/lib/data/errors";
import { bucketFor, type Range, type RangeWindow } from "@/lib/insights-range";

/**
 * Aggregates for the insights dashboard.
 *
 * Every one of these is a GROUP BY inside Postgres, reached through
 * supabase.rpc() so the SECURITY INVOKER functions still run under RLS. None
 * of them pulls rows to reduce in JavaScript.
 *
 * Each carries the count its average came from. A mean over two entries is
 * noise, and the UI needs to be able to say so rather than present it as a
 * finding.
 */

export type TrendPoint = {
  /** Local calendar date of the bucket start. */
  date: string;
  average: number;
  count: number;
  /** Present only when the bucket holds exactly one entry. */
  note: string | null;
};

export type ExerciseComparison = {
  exercised: boolean;
  average: number;
  count: number;
};

export const SLEEP_BUCKETS = ["under_6", "six_to_eight", "eight_plus"] as const;
export type SleepBucket = (typeof SLEEP_BUCKETS)[number];

export const SLEEP_BUCKET_LABELS: Record<SleepBucket, string> = {
  under_6: "Under 6h",
  six_to_eight: "6 to 8h",
  eight_plus: "8h or more",
};

export type SleepComparison = {
  bucket: SleepBucket;
  average: number;
  count: number;
};

export type DayMood = {
  date: string;
  average: number;
  count: number;
  entryId: string | null;
};

export type InsightsSummary = {
  totalEntries: number;
  recentEntries: number;
  firstLogged: string | null;
};

// PostgREST serialises numeric as a number or a string depending on version,
// and count(*)::integer can arrive either way too.
function toNumber(value: number | string | null): number {
  if (value === null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function getMoodOverTime(
  range: Range,
  window: RangeWindow,
  timeZone: string,
): Promise<TrendPoint[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("mood_over_time", {
    p_from: window.from.toISOString(),
    p_to: window.to.toISOString(),
    p_bucket: bucketFor(range),
    p_time_zone: timeZone,
  });

  if (error) failRead("mood over time", error);

  return (data ?? []).map(
    (row: {
      bucket_start: string;
      avg_rating: unknown;
      entry_count: unknown;
      single_note: string | null;
    }) => ({
      date: row.bucket_start,
      average: toNumber(row.avg_rating as number | string | null),
      count: toNumber(row.entry_count as number | string | null),
      note: row.single_note,
    }),
  );
}

export async function getMoodByExercise(
  window: RangeWindow,
): Promise<ExerciseComparison[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("mood_by_exercise", {
    p_from: window.from.toISOString(),
    p_to: window.to.toISOString(),
  });

  if (error) failRead("mood by exercise", error);

  return (data ?? []).map(
    (row: {
      exercised: boolean;
      avg_rating: unknown;
      entry_count: unknown;
    }) => ({
      exercised: row.exercised,
      average: toNumber(row.avg_rating as number | string | null),
      count: toNumber(row.entry_count as number | string | null),
    }),
  );
}

export async function getMoodBySleep(
  window: RangeWindow,
): Promise<SleepComparison[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("mood_by_sleep", {
    p_from: window.from.toISOString(),
    p_to: window.to.toISOString(),
  });

  if (error) failRead("mood by sleep", error);

  return (data ?? []).map(
    (row: { bucket: string; avg_rating: unknown; entry_count: unknown }) => ({
      bucket: row.bucket as SleepBucket,
      average: toNumber(row.avg_rating as number | string | null),
      count: toNumber(row.entry_count as number | string | null),
    }),
  );
}

export async function getMoodByDay(
  window: RangeWindow,
  timeZone: string,
): Promise<DayMood[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("mood_by_day", {
    p_from: window.from.toISOString(),
    p_to: window.to.toISOString(),
    p_time_zone: timeZone,
  });

  if (error) failRead("mood by day", error);

  return (data ?? []).map(
    (row: {
      day: string;
      avg_rating: unknown;
      entry_count: unknown;
      single_entry_id: string | null;
    }) => ({
      date: row.day,
      average: toNumber(row.avg_rating as number | string | null),
      count: toNumber(row.entry_count as number | string | null),
      entryId: row.single_entry_id,
    }),
  );
}

export async function getInsightsSummary(
  timeZone: string,
): Promise<InsightsSummary> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("insights_summary", {
    p_time_zone: timeZone,
  });

  if (error) failRead("insights summary", error);

  // A setof function returns an array even when it yields one row.
  const row = (data ?? [])[0] as
    | {
        total_entries: unknown;
        recent_entries: unknown;
        first_logged: string | null;
      }
    | undefined;

  return {
    totalEntries: toNumber((row?.total_entries ?? 0) as number | string),
    recentEntries: toNumber((row?.recent_entries ?? 0) as number | string),
    firstLogged: row?.first_logged ?? null,
  };
}
