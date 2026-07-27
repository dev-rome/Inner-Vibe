-- Custom SQL migration file, put your code below! 
---- Enable RLS on every table. Once enabled, ALL access is denied by default
-- until a policy explicitly allows it. This is the key safety property:
-- forgetting a policy fails closed (no access), never open.
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;

-- ENTRIES: a user has full control over their own entries only.
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- TAGS: read shared system tags + your own; write only your own.
CREATE POLICY "Users can view system and own tags"
  ON tags FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- ENTRY_TAGS: control links only for entries you own.
-- Ownership is checked by looking up the linked entry.
CREATE POLICY "Users can view links for their own entries"
  ON entry_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
        AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert links for their own entries"
  ON entry_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
        AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links for their own entries"
  ON entry_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_tags.entry_id
        AND entries.user_id = auth.uid()
    )
  );