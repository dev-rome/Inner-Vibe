import { createClient } from "@/lib/supabase/server";
import type { InferSelectModel } from "drizzle-orm";
import { entries } from "@/db/schema";

// Type derived from the Drizzle schema — one source of truth for the shape.
export type Entry = InferSelectModel<typeof entries>;

/**
 * Fetch the current user's entries, newest first.
 * RLS guarantees only the authenticated user's rows are returned,
 * even though this query has no explicit user_id filter.
 */
export async function getEntries(): Promise<Entry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("logged_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch entries: ${error.message}`);
  }

  return data ?? [];
}
