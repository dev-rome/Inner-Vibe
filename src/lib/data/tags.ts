import { createClient } from "@/lib/supabase/server";
import { failRead } from "@/lib/data/errors";

// What the UI needs, not the database row. user_id collapses to isCustom.
export type Tag = {
  id: string;
  name: string;
  isCustom: boolean;
};

type TagRow = {
  id: string;
  name: string;
  user_id: string | null;
};

// No user filter: the RLS SELECT policy returns the shared system tags plus
// the caller's own, so this query answers differently per user.
export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tags")
    .select("id, name, user_id")
    .order("name", { ascending: true });

  if (error) {
    failRead("tags", error);
  }

  return (data ?? []).map(toTag);
}

function toTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    isCustom: row.user_id !== null,
  };
}
