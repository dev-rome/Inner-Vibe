"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEntry } from "@/lib/data/entries";
import { SessionExpiredError } from "@/lib/data/errors";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import {
  parseCreateEntryForm,
  type EntryFieldErrors,
} from "@/lib/validation/entry";
import {
  emptySubmission,
  readSubmission,
  type EntryFormState,
  type EntrySubmission,
} from "./form-state";

function failure(
  message: string,
  values: EntrySubmission,
  fieldErrors: EntryFieldErrors = {},
): EntryFormState {
  return { status: "error", message, fieldErrors, savedAt: null, values };
}

export async function createEntryAction(
  _previousState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  // Read before anything can fail, so every error path can hand the values
  // back and the form can restore itself.
  const values = readSubmission(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not a duplicate of the dashboard layout's guard. A Server Action is a POST
  // endpoint against this route, reachable without ever rendering the page.
  if (!user) {
    return failure(
      "Your session has expired. Log in again to save this.",
      values,
    );
  }

  const parsed = parseCreateEntryForm(formData);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return failure(
      "Check the highlighted fields and try again.",
      values,
      fieldErrors,
    );
  }

  // Flagged rather than redirected inside the catch: redirect() signals by
  // throwing, so calling it in there would be caught by this same block and
  // reported as a generic save failure.
  let sessionExpired = false;

  try {
    await createEntry(parsed.data);
  } catch (error) {
    if (error instanceof SessionExpiredError) {
      sessionExpired = true;
    } else {
      // Log the cause, return something generic: database errors carry column
      // names, constraint names and row contents.
      console.error("createEntryAction failed", error);
      return failure(
        "Something went wrong saving that. Please try again.",
        values,
      );
    }
  }

  if (sessionExpired) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  // refresh(), not revalidatePath(): these reads are cookie-dependent and were
  // never cached. Next ships the re-render alongside this return value.
  refresh();

  return {
    status: "success",
    message: "Entry saved.",
    fieldErrors: {},
    savedAt: Date.now(),
    values: emptySubmission,
  };
}
