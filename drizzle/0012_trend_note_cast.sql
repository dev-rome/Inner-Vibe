-- Custom SQL migration file, put your code below! --

-- entries.note is varchar(1000), and RETURN QUERY demands the column types
-- match the declared ones exactly -- varchar does not satisfy text. The cast
-- goes here rather than widening the declaration to varchar, because the
-- column's length cap is a storage detail the API has no reason to expose.

CREATE OR REPLACE FUNCTION public.mood_over_time(
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
    -- Only when the bucket holds one entry: there is no honest way to pick a
    -- single note to represent an average of several.
    (CASE WHEN count(*) = 1 THEN (array_agg(e.note))[1] END)::text
  FROM public.entries e
  WHERE e.logged_at >= p_from
    AND e.logged_at < p_to
  GROUP BY 1
  ORDER BY 1;
END;
$$;

NOTIFY pgrst, 'reload schema';
