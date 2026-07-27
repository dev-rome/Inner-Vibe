import { z } from "zod";

// Mirror the database CHECK constraints and varchar caps. Change both together.
export const MIN_RATING = 1;
export const MAX_RATING = 6;
export const MAX_NOTE_LENGTH = 1000;
export const MAX_TAG_NAME_LENGTH = 40;
export const MAX_SLEEP_HOURS = 24;

const MAX_TAGS_PER_ENTRY = 25;
const MAX_NEW_TAGS_PER_ENTRY = 10;

export const createEntrySchema = z.object({
  rating: z
    .int("Choose how you're feeling.")
    .min(MIN_RATING, "Choose how you're feeling.")
    .max(MAX_RATING, "Choose how you're feeling."),

  note: z
    .string()
    .max(MAX_NOTE_LENGTH, `Keep the note under ${MAX_NOTE_LENGTH} characters.`)
    .nullable(),

  sleepHours: z
    .number("Enter sleep as a number of hours.")
    .min(0, "Sleep can't be negative.")
    .max(MAX_SLEEP_HOURS, `Sleep can't be more than ${MAX_SLEEP_HOURS} hours.`)
    .nullable(),

  // Nullable, not false by default: "didn't exercise" and "didn't say" differ.
  exercised: z.boolean().nullable(),

  tagIds: z.array(z.uuid()).max(MAX_TAGS_PER_ENTRY),

  newTagNames: z
    .array(
      z
        .string()
        .trim()
        .min(1, "A tag needs a name.")
        .max(
          MAX_TAG_NAME_LENGTH,
          `Keep tags under ${MAX_TAG_NAME_LENGTH} characters.`,
        ),
    )
    .max(MAX_NEW_TAGS_PER_ENTRY),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

export type EntryFieldErrors = Partial<
  Record<keyof CreateEntryInput, string[]>
>;

export function parseCreateEntryForm(formData: FormData) {
  return createEntrySchema.safeParse({
    rating: toNumberOrUndefined(formData.get("rating")),
    note: toTrimmedStringOrNull(formData.get("note")),
    sleepHours: toNumberOrNull(formData.get("sleepHours")),
    exercised: toBooleanOrNull(formData.get("exercised")),
    tagIds: formData.getAll("tagIds").map(String),
    newTagNames: formData.getAll("newTagNames").map(String),
  });
}

function toTrimmedStringOrNull(
  value: FormDataEntryValue | null,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function toNumberOrNull(value: FormDataEntryValue | null): number | null {
  const trimmed = toTrimmedStringOrNull(value);
  if (trimmed === null) return null;
  const parsed = Number(trimmed);
  // NaN, not null, so "abc" fails validation instead of reading as left blank.
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

// undefined, not null, so a missing rating reports "choose how you're feeling"
// rather than a type complaint.
function toNumberOrUndefined(
  value: FormDataEntryValue | null,
): number | undefined {
  const parsed = toNumberOrNull(value);
  return parsed === null ? undefined : parsed;
}

function toBooleanOrNull(value: FormDataEntryValue | null): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}
