-- Custom SQL migration file, put your code below! --

-- Creating an entry is up to three writes: new custom tags, the entry row, and
-- the entry_tags links. The Supabase JS client cannot open a transaction, so
-- doing this from TypeScript means a partial write is possible. A plpgsql
-- function body IS a transaction, so moving the whole operation here makes it
-- atomic: any failure rolls back all three.
--
-- SECURITY INVOKER (the default, stated explicitly because it is the entire
-- point) means the function runs as the calling role, not the owner. auth.uid()
-- still resolves to the logged-in user and every statement inside is still
-- filtered by RLS. We get atomicity without punching a hole in the isolation
-- guarantee.
--
-- SET search_path = '' is hardening: an empty search path means nothing on the
-- caller's path can shadow the tables or functions this body references. The
-- cost is that every name has to be fully qualified.

CREATE OR REPLACE FUNCTION public.create_entry(
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
  v_user_id  uuid := auth.uid();
  v_entry_id uuid;
BEGIN
  -- RLS would reject the insert anyway, but failing here gives a clear error
  -- instead of an opaque policy violation.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  INSERT INTO public.entries (user_id, rating, note, sleep_hours, exercised)
  VALUES (v_user_id, p_rating, p_note, p_sleep_hours, p_exercised)
  RETURNING id INTO v_entry_id;

  -- Create any genuinely new custom tags.
  --
  -- Names are stored lowercase. The unique index on (user_id, name) is
  -- case-sensitive, so without normalising here "Work" and "work" would both
  -- insert and the picker would show duplicates. Lowercase also matches the
  -- seeded system tags.
  --
  -- The NOT EXISTS skips names the user can already see, whether that is a
  -- system tag or one of their own, so re-adding an existing name resolves to
  -- the existing tag rather than creating a near-duplicate.
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

  -- Link the entry to every requested tag, resolving ids and names in one pass.
  --
  -- Note what the user_id predicate does: tag ids come from the client, so a
  -- forged request could name another user's tag id. Selecting only from rows
  -- the caller is allowed to see means those ids match nothing and are silently
  -- dropped rather than erroring, which would leak that the row exists. RLS on
  -- tags enforces the same thing; this is the explicit, readable half of it.
  INSERT INTO public.entry_tags (entry_id, tag_id)
  SELECT v_entry_id, t.id
  FROM public.tags t
  WHERE (t.user_id IS NULL OR t.user_id = v_user_id)
    AND (
      t.id = ANY (p_tag_ids)
      OR t.name = ANY (SELECT lower(btrim(n)) FROM unnest(p_new_tag_names) AS n)
    )
  ON CONFLICT DO NOTHING;

  RETURN v_entry_id;
END;
$$;

-- Functions are executable by PUBLIC by default. Close that, then open it to
-- logged-in users only. Logged-out callers have no business creating entries.
REVOKE ALL ON FUNCTION public.create_entry(
  smallint, text, numeric, boolean, uuid[], text[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_entry(
  smallint, text, numeric, boolean, uuid[], text[]
) TO authenticated;

-- PostgREST caches the schema. Without this the new function 404s until the
-- next reload.
NOTIFY pgrst, 'reload schema';
