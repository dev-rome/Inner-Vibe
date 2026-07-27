-- Custom SQL migration file, put your code below! --
-- Expose our Drizzle-created tables to Supabase's Data API roles.
-- The `authenticated` role is what the Supabase client uses for logged-in
-- requests; `anon` is for logged-out. RLS policies still gate WHICH rows
-- each role can touch — these grants only permit touching the table at all.
-- Without this, queries fail with "permission denied" before RLS even runs.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tags TO authenticated;
GRANT SELECT, INSERT, DELETE ON entry_tags TO authenticated;

-- Allow reading the shared system tags while logged out, if ever needed.
-- (RLS still restricts anon to only user_id IS NULL rows.)
GRANT SELECT ON tags TO anon;