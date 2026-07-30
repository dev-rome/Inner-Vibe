import { z } from "zod";

/** Matches the display_name column, so a valid name can never fail to store. */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * What the app should call you.
 *
 * Blank means "no name", not an error: someone who has set a name has to be
 * able to take it back, and a form that refuses to clear a field traps them
 * with it. Empty and whitespace-only both resolve to null so the column holds
 * one representation of absence rather than three.
 *
 * The control-character check is the only real restriction. Names are not a
 * closed set — they carry accents, scripts, apostrophes, spaces — and any
 * "letters only" rule silently tells some people their name is invalid. What
 * cannot be allowed is the invisible: newlines, bidi overrides and zero-width
 * joiners let a name reshape the text around it.
 */
export const displayNameSchema = z
  .string()
  .trim()
  .max(
    MAX_DISPLAY_NAME_LENGTH,
    `Keep it to ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`,
  )
  .refine((value) => !/\p{C}/u.test(value), {
    message: "That contains characters we cannot store.",
  })
  // Runs after the checks so the empty string is validated, then normalised.
  .transform((value) => (value === "" ? null : value));

export function parseDisplayName(raw: FormDataEntryValue | null) {
  return displayNameSchema.safeParse(typeof raw === "string" ? raw : "");
}
