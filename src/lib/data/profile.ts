import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireUserForWrite } from "@/lib/data/session";
import { failRead, failWrite } from "@/lib/data/errors";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "@/lib/time-zone";

export type Profile = {
  timeZone: string;
  /** Null when never set. The greeting stands alone rather than guessing. */
  displayName: string | null;
};

/**
 * The user's settings, with defaults filled in.
 *
 * A missing row is normal, not an error: profiles are created on first save
 * rather than by a trigger, so anyone who has never opened settings has none.
 * A stored zone this runtime does not recognise also falls back, since the IANA
 * database drops names occasionally and a stale one should not break every date
 * on the page.
 *
 * Cached per request. Pages that stream several sections independently each
 * need the zone, and none of them should pay for its own round trip.
 */
export const getProfile = cache(async function getProfile(): Promise<Profile> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("time_zone, display_name")
    .maybeSingle();

  if (error) {
    failRead("profile", error);
  }

  const zone = data?.time_zone;

  return {
    timeZone: zone && isValidTimeZone(zone) ? zone : DEFAULT_TIME_ZONE,
    // Empty strings should not exist in the column, but a row written before
    // the validation did is not worth trusting on that.
    displayName: data?.display_name?.trim() || null,
  };
});

/** Kept because most callers want only the zone and should not know the rest. */
export async function getTimeZone(): Promise<string> {
  return (await getProfile()).timeZone;
}

/**
 * Write settings, creating the row if this is the first save.
 *
 * Takes a partial so each form owns its own fields: the timezone form must not
 * blank a name it never showed, and the name form must not reset a zone.
 */
export async function saveProfile(
  userId: string,
  changes: Partial<Profile>,
): Promise<void> {
  await requireUserForWrite();
  const supabase = await createClient();

  // Upsert because the row may not exist yet. user_id is supplied explicitly
  // so the RLS WITH CHECK has something to compare against.
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      ...(changes.timeZone !== undefined && { time_zone: changes.timeZone }),
      // Compared against undefined, not falsiness: null is a real value here,
      // and it is how someone clears their name.
      ...(changes.displayName !== undefined && {
        display_name: changes.displayName,
      }),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    failWrite("save profile", error);
  }
}

export async function saveTimeZone(
  userId: string,
  timeZone: string,
): Promise<void> {
  return saveProfile(userId, { timeZone });
}
