import { createClient } from "@/lib/supabase/server";
import { failRead } from "@/lib/data/errors";
import { endOfDay, startOfDay } from "@/lib/time-zone";
import { type Entry, entrySelect, toEntry, type EntryRow } from "./entries";

export const PAGE_SIZE = 20;

export type JournalFilters = {
  tagId?: string;
  mood?: number;
  from?: string;
  to?: string;
};

export type Cursor = { loggedAt: string; id: string };

export type JournalPage = {
  entries: Entry[];
  nextCursor: Cursor | null;
};

/** Opaque to the URL, but readable enough to debug. */
export function encodeCursor(cursor: Cursor): string {
  return `${cursor.loggedAt}|${cursor.id}`;
}

export function decodeCursor(raw: string): Cursor | null {
  const [loggedAt, id] = raw.split("|");
  if (!loggedAt || !id || Number.isNaN(Date.parse(loggedAt))) return null;
  return { loggedAt, id };
}

/**
 * A page of history, newest first.
 *
 * Keyset rather than offset: the ordering key is carried in the URL and the
 * next page asks for rows strictly after it. Logging a new entry mid-browse
 * cannot shift a row onto a page you already read, and there is no offset for
 * the database to count past, so page 50 costs the same as page 1. The price
 * is no page numbers, which a journal does not need.
 *
 * `id` is part of the key, not decoration. Two entries can share a timestamp,
 * and ordering on `logged_at` alone would make their relative position
 * arbitrary between queries — enough to drop or repeat one at a page edge.
 */
export async function getJournalPage(
  filters: JournalFilters,
  cursor: Cursor | null,
  timeZone: string,
): Promise<JournalPage> {
  const supabase = await createClient();

  // The `match` embed exists only to filter. Filtering the display embed
  // instead would narrow it to the matched tag, so a card filtered by "work"
  // would claim to have exactly one tag.
  const select = filters.tagId
    ? `${entrySelect}, match:entry_tags!inner(tag_id)`
    : entrySelect;

  let query = supabase
    .from("entries")
    .select(select)
    .order("logged_at", { ascending: false })
    .order("id", { ascending: false })
    // One extra row is the cheapest way to know whether another page exists.
    .limit(PAGE_SIZE + 1);

  if (filters.tagId) {
    query = query.eq("match.tag_id", filters.tagId);
  }

  if (filters.mood !== undefined) {
    query = query.eq("rating", filters.mood);
  }

  if (filters.from) {
    query = query.gte(
      "logged_at",
      startOfDay(filters.from, timeZone).toISOString(),
    );
  }

  if (filters.to) {
    // Exclusive upper bound: endOfDay is the next day's first instant.
    query = query.lt("logged_at", endOfDay(filters.to, timeZone).toISOString());
  }

  if (cursor) {
    const { loggedAt, id } = cursor;
    query = query.or(
      `logged_at.lt.${loggedAt},and(logged_at.eq.${loggedAt},id.lt.${id})`,
    );
  }

  const { data, error } = await query;

  if (error) {
    failRead("journal", error);
  }

  const rows = (data ?? []) as unknown as EntryRow[];
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page.at(-1);

  return {
    entries: page.map(toEntry),
    nextCursor:
      hasMore && last ? { loggedAt: last.logged_at, id: last.id } : null,
  };
}

/** A single entry, or null when it does not exist or is not yours. */
export async function getEntry(id: string): Promise<Entry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("entries")
    .select(entrySelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    failRead("entry", error);
  }

  // RLS makes "someone else's entry" and "no such entry" indistinguishable
  // here, which is the behaviour we want: a 404 either way leaks nothing.
  return data ? toEntry(data as unknown as EntryRow) : null;
}
