import { createClient } from "@/lib/supabase/server";
import type { CreateEntryInput } from "@/lib/validation/entry";
import type { Tag } from "@/lib/data/tags";
import { failRead, failWrite } from "@/lib/data/errors";

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

export type EntryRow = {
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

// Shared so the journal queries cannot drift from this shape.
export const entrySelect =
  "id, rating, note, sleep_hours, exercised, logged_at, entry_tags(tags(id, name, user_id))";

// No user filter: RLS decides the rows, including the embedded tags.
export async function getEntries(limit?: number): Promise<Entry[]> {
  const supabase = await createClient();

  let query = supabase
    .from("entries")
    .select(entrySelect)
    .order("logged_at", { ascending: false });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    failRead("entries", error);
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
    failWrite("create entry", error);
  }

  return data as string;
}

/**
 * Replace an entry and its tags, atomically.
 *
 * Same reasoning as createEntry: the tag links are replaced by a DELETE then
 * an INSERT, which must not be able to half-succeed.
 */
export async function updateEntry(
  id: string,
  input: CreateEntryInput,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_entry", {
    p_entry_id: id,
    p_rating: input.rating,
    p_note: input.note,
    p_sleep_hours: input.sleepHours,
    p_exercised: input.exercised,
    p_tag_ids: input.tagIds,
    p_new_tag_names: input.newTagNames,
  });

  if (error) {
    failWrite("update entry", error);
  }
}

/**
 * Delete an entry. entry_tags cascades from the foreign key.
 *
 * No ownership check here: the RLS DELETE policy already restricts this to the
 * caller's own rows, so a forged id simply matches nothing.
 */
export async function deleteEntry(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("entries").delete().eq("id", id);

  if (error) {
    failWrite("delete entry", error);
  }
}

export function toEntry(row: EntryRow): Entry {
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
