import { createClient } from "@/lib/supabase/server";
import type { CreateEntryInput } from "@/lib/validation/entry";
import type { Tag } from "@/lib/data/tags";

// Domain shape, not the database row. The Supabase client knows nothing about
// the Drizzle schema and returns raw columns, so toEntry is the seam.
export type Entry = {
  id: string;
  rating: number;
  note: string | null;
  sleepHours: number | null;
  exercised: boolean | null;
  loggedAt: Date;
  tags: Tag[];
};

type EntryRow = {
  id: string;
  rating: number;
  note: string | null;
  // PostgREST serialises numeric as a number or a string depending on version.
  sleep_hours: number | string | null;
  exercised: boolean | null;
  logged_at: string;
  entry_tags:
    | { tags: { id: string; name: string; user_id: string | null } | null }[]
    | null;
};

// No user filter: RLS decides the rows, including the embedded tags.
export async function getEntries(): Promise<Entry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("entries")
    .select(
      "id, rating, note, sleep_hours, exercised, logged_at, entry_tags(tags(id, name, user_id))",
    )
    .order("logged_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch entries: ${error.message}`);
  }

  return ((data ?? []) as unknown as EntryRow[]).map(toEntry);
}

/**
 * Create an entry with its tags, atomically.
 *
 * Goes through the create_entry function rather than three client calls: the
 * Supabase client cannot open a transaction, and a partial write leaves an
 * entry that silently lost its tags. The function is SECURITY INVOKER, so RLS
 * still applies inside it.
 *
 * Takes already-validated input; parsing FormData is the Server Action's job.
 */
export async function createEntry(input: CreateEntryInput): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_entry", {
    p_rating: input.rating,
    p_note: input.note,
    p_sleep_hours: input.sleepHours,
    p_exercised: input.exercised,
    p_tag_ids: input.tagIds,
    p_new_tag_names: input.newTagNames,
  });

  if (error) {
    throw new Error(`Failed to create entry: ${error.message}`);
  }

  return data as string;
}

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    rating: row.rating,
    note: row.note,
    sleepHours: toNumberOrNull(row.sleep_hours),
    exercised: row.exercised,
    loggedAt: new Date(row.logged_at),
    tags: (row.entry_tags ?? [])
      .map((link) => link.tags)
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        isCustom: tag.user_id !== null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
