"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createEntry } from "@/lib/data/entries";
import {
  parseCreateEntryForm,
  type EntryFieldErrors,
} from "@/lib/validation/entry";
import type { EntryFormState } from "./form-state";

function failure(
  message: string,
  fieldErrors: EntryFieldErrors = {},
): EntryFormState {
  return { status: "error", message, fieldErrors, savedAt: null };
}

export async function createEntryAction(
  _previousState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not a duplicate of the dashboard layout's guard. A Server Action is a POST
  // endpoint against this route, reachable without ever rendering the page.
  if (!user) {
    return failure("Your session has expired. Log in again to save this.");
  }

  const parsed = parseCreateEntryForm(formData);

  if (!parsed.success) {
    const { fieldErrors } = z.flattenError(parsed.error);
    return failure("Check the highlighted fields and try again.", fieldErrors);
  }

  try {
    await createEntry(parsed.data);
  } catch (error) {
    // Log the cause, return something generic: database errors carry column
    // names, constraint names and row contents.
    console.error("createEntryAction failed", error);
    return failure("Something went wrong saving that. Please try again.");
  }

  // refresh(), not revalidatePath(): these reads are cookie-dependent and were
  // never cached. Next ships the re-render alongside this return value.
  refresh();

  return {
    status: "success",
    message: "Entry saved.",
    fieldErrors: {},
    savedAt: Date.now(),
  };
}
