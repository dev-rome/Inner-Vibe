-- Custom SQL migration file, put your code below! --

-- The trend tooltip shows the note for a point when there is one to show.
--
-- A bucket can cover several entries, and there is no honest way to pick one
-- note to represent an average of four. So the note comes back only when the
-- bucket holds exactly one entry — the same rule mood_by_day already uses for
-- single_entry_id. Everything else gets the count instead.
--
-- DROP before CREATE because the return type changes; CREATE OR REPLACE cannot
-- alter a function's OUT parameters.

DROP FUNCTION IF EXISTS public.mood_over_time(timestamptz, timestamptz, text, text);

CREATE FUNCTION public.mood_over_time(
  p_from      timestamptz,
  p_to        timestamptz,
  p_bucket    text,
  p_time_zone text
)
RETURNS TABLE (
  bucket_start date,
  avg_rating   numeric,
  entry_count  integer,
  single_note  text
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_bucket NOT IN ('day', 'week') THEN
    RAISE EXCEPTION 'unsupported bucket: %', p_bucket USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    date_trunc(p_bucket, e.logged_at AT TIME ZONE p_time_zone)::date,
    round(avg(e.rating)::numeric, 2),
    count(*)::integer,
    CASE WHEN count(*) = 1 THEN (array_agg(e.note))[1] END
  FROM public.entries e
  WHERE e.logged_at >= p_from
    AND e.logged_at < p_to
  GROUP BY 1
  ORDER BY 1;
END;
$$;

REVOKE ALL ON FUNCTION public.mood_over_time(timestamptz, timestamptz, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mood_over_time(timestamptz, timestamptz, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
