-- Custom SQL migration file, put your code below! --

-- Editing has the same problem create did: the entry row and its tag links are
-- separate writes, and the Supabase client cannot open a transaction. Replacing
-- the links means a DELETE followed by an INSERT, so a failure between them
-- would leave an entry with no tags at all.
--
-- SECURITY INVOKER, so the UPDATE and DELETE policies still decide what this
-- can touch. Ownership is not re-checked in the body because RLS already
-- refuses rows the caller does not own; the NOT FOUND check turns that
-- refusal into a clear error.

CREATE OR REPLACE FUNCTION public.update_entry(
  p_entry_id      uuid,
  p_rating        smallint,
  p_note          text    DEFAULT NULL,
  p_sleep_hours   numeric DEFAULT NULL,
  p_exercised     boolean DEFAULT NULL,
  p_tag_ids       uuid[]  DEFAULT '{}',
  p_new_tag_names text[]  DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_updated uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  UPDATE public.entries
  SET rating      = p_rating,
      note        = p_note,
      sleep_hours = p_sleep_hours,
      exercised   = p_exercised
  WHERE id = p_entry_id
  RETURNING id INTO v_updated;

  -- Either the entry does not exist or it belongs to someone else. RLS makes
  -- those indistinguishable, which is what we want.
  IF v_updated IS NULL THEN
    RAISE EXCEPTION 'entry not found' USING ERRCODE = 'P0002';
  END IF;

  -- Same normalisation as create_entry: names are stored lowercase so the
  -- case-sensitive unique index on (user_id, name) actually holds.
  INSERT INTO public.tags (user_id, name)
  SELECT DISTINCT v_user_id, lower(btrim(n))
  FROM unnest(p_new_tag_names) AS n
  WHERE btrim(n) <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM public.tags t
      WHERE t.name = lower(btrim(n))
        AND (t.user_id IS NULL OR t.user_id = v_user_id)
    )
  ON CONFLICT DO NOTHING;

  -- Replace rather than diff. The set is small, and computing a delta would be
  -- more code for no gain inside a transaction that is already atomic.
  DELETE FROM public.entry_tags WHERE entry_id = p_entry_id;

  -- Selecting only from tags the caller can see means a forged id belonging to
  -- another user matches nothing and is dropped, rather than erroring and
  -- confirming the row exists.
  INSERT INTO public.entry_tags (entry_id, tag_id)
  SELECT p_entry_id, t.id
  FROM public.tags t
  WHERE (t.user_id IS NULL OR t.user_id = v_user_id)
    AND (
      t.id = ANY (p_tag_ids)
      OR t.name = ANY (SELECT lower(btrim(n)) FROM unnest(p_new_tag_names) AS n)
    )
  ON CONFLICT DO NOTHING;

  RETURN p_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_entry(
  uuid, smallint, text, numeric, boolean, uuid[], text[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_entry(
  uuid, smallint, text, numeric, boolean, uuid[], text[]
) TO authenticated;

NOTIFY pgrst, 'reload schema';
