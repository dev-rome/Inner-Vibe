import type { EntryFieldErrors } from "@/lib/validation/entry";

// Kept out of actions.ts: a "use server" module may only export async
// functions, so a plain object export there fails the build.
export type EntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: EntryFieldErrors;
  // The client keys the form on this so a success remounts it empty. Stays
  // null on failure, which keeps everything the user typed.
  savedAt: number | null;
};

export const initialEntryFormState: EntryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  savedAt: null,
};
