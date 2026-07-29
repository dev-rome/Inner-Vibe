"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/data/session";
import { deleteEntry, updateEntry } from "@/lib/data/entries";
import { SessionExpiredError } from "@/lib/data/errors";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import { parseCreateEntryForm } from "@/lib/validation/entry";
import {
  readSubmission,
  type EntryFormState,
} from "@/app/dashboard/form-state";

export async function updateEntryAction(
  id: string,
  _previousState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const values = readSubmission(formData);

  const fail = (message: string, fieldErrors = {}): EntryFormState => ({
    status: "error",
    message,
    fieldErrors,
    savedAt: null,
    values,
  });

  // A Server Action is a POST endpoint; the page guard is not a boundary.
  if (!(await getUser())) {
    return fail("Your session has expired. Log in again to save this.");
  }

  const parsed = parseCreateEntryForm(formData);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return fail("Check the highlighted fields and try again.", fieldErrors);
  }

  let sessionExpired = false;

  try {
    await updateEntry(id, parsed.data);
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      sessionExpired = true;
    } else {
      console.error("updateEntryAction failed", error);
      return fail("Something went wrong saving that. Please try again.");
    }
  }

  // redirect throws, so it stays outside the catch that would swallow it.
  if (sessionExpired) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  refresh();

  return {
    status: "success",
    message: "Changes saved.",
    fieldErrors: {},
    savedAt: Date.now(),
    // The saved values, not an empty set. React resets the uncontrolled form
    // once the action resolves, so returning nothing here would blank the
    // fields and read as "the edit was lost" right after it succeeded.
    values,
  };
}

/**
 * Delete an entry, then leave the page that was showing it.
 *
 * Irreversible, so the UI in front of this asks first. The action itself does
 * not re-confirm: a POST that reaches here is the confirmation.
 */
export async function deleteEntryAction(id: string): Promise<void> {
  if (!(await getUser())) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  let sessionExpired = false;

  try {
    await deleteEntry(id);
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      sessionExpired = true;
    } else {
      console.error("deleteEntryAction failed", error);
      throw error;
    }
  }

  if (sessionExpired) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  // The detail page for this id is now a 404, so send them to the list.
  redirect("/dashboard/journal");
}
