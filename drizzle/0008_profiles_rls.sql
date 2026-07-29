-- Custom SQL migration file, put your code below! --

-- Same shape as the other tables: RLS on first, so the table fails closed if a
-- policy is ever missed, then the grants that let the Data API reach it at all.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy. Nothing in the app deletes a profile, and leaving it out
-- means the operation is denied rather than merely unused.

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

NOTIFY pgrst, 'reload schema';
