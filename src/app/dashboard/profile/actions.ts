"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/data/session";
import { saveProfile, saveTimeZone } from "@/lib/data/profile";
import { SessionExpiredError } from "@/lib/data/errors";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import { isValidTimeZone } from "@/lib/time-zone";
import { parseDisplayName } from "@/lib/validation/profile";
import type { SettingsFormState } from "./form-state";

export async function saveTimeZoneAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const timeZone = String(formData.get("timeZone") ?? "");

  const user = await getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired." };
  }

  // Checked against the runtime's own IANA list rather than a regex: a
  // well-formed name that this Node build does not know would still break
  // every date on the page.
  if (!isValidTimeZone(timeZone)) {
    return { status: "error", message: "That is not a timezone we recognise." };
  }

  let sessionExpired = false;

  try {
    await saveTimeZone(user.id, timeZone);
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      sessionExpired = true;
    } else {
      console.error("saveTimeZoneAction failed", error);
      return { status: "error", message: "Could not save that. Try again." };
    }
  }

  if (sessionExpired) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  // Every date in the app is derived from this, so the whole route re-renders.
  refresh();

  return { status: "success", message: "Timezone saved." };
}

export async function saveDisplayNameAction(
  _previousState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const user = await getUser();

  if (!user) {
    return { status: "error", message: "Your session has expired." };
  }

  const parsed = parseDisplayName(formData.get("displayName"));

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "That name will not do.",
    };
  }

  let sessionExpired = false;

  try {
    await saveProfile(user.id, { displayName: parsed.data });
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      sessionExpired = true;
    } else {
      console.error("saveDisplayNameAction failed", error);
      return { status: "error", message: "Could not save that. Try again." };
    }
  }

  if (sessionExpired) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  // The greeting lives on another route, so a targeted revalidate would miss it.
  refresh();

  return {
    status: "success",
    message: parsed.data ? "Name saved." : "Name removed.",
  };
}
