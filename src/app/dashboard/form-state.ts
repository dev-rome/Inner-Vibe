import type { EntryFieldErrors } from "@/lib/validation/entry";

/** Raw submitted values, echoed back so a failed save can restore the form. */
export type EntrySubmission = {
  rating: string;
  note: string;
  sleepHours: string;
  exercised: string;
  tagIds: string[];
  newTagNames: string[];
};

export const emptySubmission: EntrySubmission = {
  rating: "",
  note: "",
  sleepHours: "",
  exercised: "",
  tagIds: [],
  newTagNames: [],
};

// Kept out of actions.ts: a "use server" module may only export async
// functions, so a plain object export there fails the build.
export type EntryFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: EntryFieldErrors;
  // The client keys the form on this so a success remounts it empty.
  savedAt: number | null;
  /**
   * React resets an uncontrolled form once the action resolves, on failure as
   * well as success, so without echoing these back a rejected save would wipe
   * what the user wrote.
   */
  values: EntrySubmission;
};

export const initialEntryFormState: EntryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  savedAt: null,
  values: emptySubmission,
};

export function readSubmission(formData: FormData): EntrySubmission {
  const str = (key: string) => String(formData.get(key) ?? "");

  return {
    rating: str("rating"),
    note: str("note"),
    sleepHours: str("sleepHours"),
    exercised: str("exercised"),
    tagIds: formData.getAll("tagIds").map(String),
    newTagNames: formData.getAll("newTagNames").map(String),
  };
}
