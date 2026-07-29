-- Custom SQL migration file, put your code below! --

-- Aggregation for the insights dashboard, done in Postgres rather than by
-- pulling rows and reducing in JavaScript.
--
-- These are functions rather than PostgREST selects because PostgREST can only
-- group by columns it selects. Three of these group by a *computed* key --
-- date_trunc for the trend and calendar, a CASE for the sleep buckets -- and
-- there is no PostgREST syntax for that.
--
-- All SECURITY INVOKER, so RLS decides which rows each aggregate sees. A
-- SECURITY DEFINER function here would silently aggregate across every user.
-- search_path is pinned empty so nothing on the caller's path can shadow the
-- tables these read.
--
-- Every function returns its group count. The UI needs it to stay honest about
-- thin data: a difference drawn from two entries is noise, and this app does
-- not tell people what their data means.
--
-- Timezone is a parameter throughout. "Per day" has no meaning without one,
-- and bucketing on the raw timestamp would file a 9pm entry under tomorrow.

-- Daily or weekly averages for the trend line.
CREATE OR REPLACE FUNCTION public.mood_over_time(
  p_from      timestamptz,
  p_to        timestamptz,
  p_bucket    text,
  p_time_zone text
)
RETURNS TABLE (bucket_start date, avg_rating numeric, entry_count integer)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- date_trunc would raise on anything else, but a checked list gives a clear
  -- error instead of a Postgres internal one.
  IF p_bucket NOT IN ('day', 'week') THEN
    RAISE EXCEPTION 'unsupported bucket: %', p_bucket USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    date_trunc(p_bucket, e.logged_at AT TIME ZONE p_time_zone)::date,
    round(avg(e.rating)::numeric, 2),
    count(*)::integer
  FROM public.entries e
  WHERE e.logged_at >= p_from
    AND e.logged_at < p_to
  GROUP BY 1
  ORDER BY 1;
END;
$$;

-- Average mood on days the user exercised versus days they did not.
-- NULL is excluded: "did not say" is not a third group, and folding it in
-- would invent a category the user never chose.
CREATE OR REPLACE FUNCTION public.mood_by_exercise(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (exercised boolean, avg_rating numeric, entry_count integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    e.exercised,
    round(avg(e.rating)::numeric, 2),
    count(*)::integer
  FROM public.entries e
  WHERE e.logged_at >= p_from
    AND e.logged_at < p_to
    AND e.exercised IS NOT NULL
  GROUP BY e.exercised
  ORDER BY e.exercised;
$$;

-- Average mood by sleep band. Boundaries are half-open, so exactly 6 hours is
-- "six to eight" and exactly 8 is "eight plus".
CREATE OR REPLACE FUNCTION public.mood_by_sleep(
  p_from timestamptz,
  p_to   timestamptz
)
RETURNS TABLE (bucket text, avg_rating numeric, entry_count integer)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN e.sleep_hours < 6 THEN 'under_6'
      WHEN e.sleep_hours < 8 THEN 'six_to_eight'
      ELSE 'eight_plus'
    END,
    round(avg(e.rating)::numeric, 2),
    count(*)::integer
  FROM public.entries e
  WHERE e.logged_at >= p_from
    AND e.logged_at < p_to
    AND e.sleep_hours IS NOT NULL
  GROUP BY 1
  -- Sorts the bands low to high without hard-coding their order twice.
  ORDER BY min(e.sleep_hours);
$$;

-- One row per day for the calendar grid.
--
-- single_entry_id is the entry's id only when the day holds exactly one, so a
-- tile can link straight to it. Days with several link to the journal filtered
-- to that date instead, because there is no single entry to open.
CREATE OR REPLACE FUNCTION public.mood_by_day(
  p_from      timestamptz,
  p_to        timestamptz,
  p_time_zone text
)
RETURNS TABLE (
  day             date,
  avg_rating      numeric,
  entry_count     integer,
  single_entry_id uuid
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    (e.logged_at AT TIME ZONE p_time_zone)::date,
    round(avg(e.rating)::numeric, 2),
    count(*)::integer,
    CASE WHEN count(*) = 1 THEN (array_agg(e.id))[1] END
  FROM public.entries e
  WHERE e.logged_at >= p_from
    AND e.logged_at < p_to
  GROUP BY 1
  ORDER BY 1;
$$;

-- Counts for the greeting, and for telling a first visit apart from a quiet
-- week. Both are cheap aggregates over the same index the ranges use.
CREATE OR REPLACE FUNCTION public.insights_summary(p_time_zone text)
RETURNS TABLE (
  total_entries  integer,
  recent_entries integer,
  first_logged   date
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    count(*)::integer,
    (count(*) FILTER (WHERE e.logged_at >= now() - interval '7 days'))::integer,
    (min(e.logged_at) AT TIME ZONE p_time_zone)::date
  FROM public.entries e;
$$;

-- Executable by logged-in users only. Logged-out callers have nothing to
-- aggregate, and RLS would return empty anyway; refusing is clearer.
REVOKE ALL ON FUNCTION public.mood_over_time(timestamptz, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mood_by_exercise(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mood_by_sleep(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mood_by_day(timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.insights_summary(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mood_over_time(timestamptz, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mood_by_exercise(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mood_by_sleep(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mood_by_day(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insights_summary(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
