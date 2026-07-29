import { createClient } from "@/lib/supabase/server";
import { failRead, failWrite } from "@/lib/data/errors";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/time-zone";

/**
 * The user's timezone, or UTC.
 *
 * A missing row is normal, not an error: profiles are created on first save
 * rather than by a trigger, so anyone who has never opened settings has none.
 * A stored value that this runtime does not recognise also falls back, since
 * the IANA database drops zones occasionally and a stale name should not break
 * every date on the page.
 */
export async function getTimeZone(): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("time_zone")
    .maybeSingle();

  if (error) {
    failRead("profile", error);
  }

  const stored = data?.time_zone;

  return stored && isValidTimeZone(stored) ? stored : DEFAULT_TIME_ZONE;
}

export async function saveTimeZone(
  userId: string,
  timeZone: string,
): Promise<void> {
  const supabase = await createClient();

  // Upsert because the row may not exist yet. user_id is supplied explicitly
  // so the RLS WITH CHECK has something to compare against.
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      time_zone: timeZone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    failWrite("save timezone", error);
  }
}
