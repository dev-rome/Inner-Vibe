import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MOOD_OPTIONS } from "@/lib/moods";
import {
  MAX_NOTE_LENGTH,
  MAX_RATING,
  MAX_SLEEP_HOURS,
  MAX_TAG_NAME_LENGTH,
  MIN_RATING,
  createEntrySchema,
  parseCreateEntryForm,
} from "./entry";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

/** A form with only the required field filled in. */
function formWith(fields: Record<string, string | string[]> = {}) {
  const formData = new FormData();
  formData.set("rating", "4");

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      formData.delete(key);
      for (const item of value) formData.append(key, item);
    } else {
      formData.set(key, value);
    }
  }

  return formData;
}

function fieldErrors(formData: FormData) {
  const result = parseCreateEntryForm(formData);
  if (result.success) return {};
  return z.flattenError(result.error).fieldErrors;
}

describe("mood scale and rating bounds", () => {
  // The scale and the bounds live in different modules and can drift. Adding a
  // seventh face without widening the schema would ship an option that fails
  // on submit.
  it("offers exactly the ratings the schema accepts", () => {
    expect(MOOD_OPTIONS.map((option) => option.value)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(MIN_RATING).toBe(1);
    expect(MAX_RATING).toBe(6);
  });

  it("gives every option a non-emoji accessible label", () => {
    for (const option of MOOD_OPTIONS) {
      expect(option.label.trim().length).toBeGreaterThan(0);
      expect(option.label).not.toBe(option.emoji);
    }
  });
});

describe("createEntrySchema", () => {
  const valid = {
    rating: 4,
    note: null,
    sleepHours: null,
    exercised: null,
    tagIds: [],
    newTagNames: [],
  };

  it.each([1, 2, 3, 4, 5, 6])("accepts rating %i", (rating) => {
    expect(createEntrySchema.safeParse({ ...valid, rating }).success).toBe(
      true,
    );
  });

  it.each([0, 7, -1, 1.5])("rejects rating %p", (rating) => {
    expect(createEntrySchema.safeParse({ ...valid, rating }).success).toBe(
      false,
    );
  });

  it.each([0, 0.5, 7.5, 24])("accepts %p hours of sleep", (sleepHours) => {
    expect(createEntrySchema.safeParse({ ...valid, sleepHours }).success).toBe(
      true,
    );
  });

  it.each([-0.5, 24.5])("rejects %p hours of sleep", (sleepHours) => {
    expect(createEntrySchema.safeParse({ ...valid, sleepHours }).success).toBe(
      false,
    );
  });

  it("accepts a note exactly at the column limit", () => {
    const note = "a".repeat(MAX_NOTE_LENGTH);
    expect(createEntrySchema.safeParse({ ...valid, note }).success).toBe(true);
  });

  it("rejects a note one character over the column limit", () => {
    const note = "a".repeat(MAX_NOTE_LENGTH + 1);
    expect(createEntrySchema.safeParse({ ...valid, note }).success).toBe(false);
  });

  it("rejects a tag id that is not a uuid", () => {
    const result = createEntrySchema.safeParse({
      ...valid,
      tagIds: ["not-a-uuid"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a tag name over the column limit", () => {
    const result = createEntrySchema.safeParse({
      ...valid,
      newTagNames: ["a".repeat(MAX_TAG_NAME_LENGTH + 1)],
    });
    expect(result.success).toBe(false);
  });
});

describe("parseCreateEntryForm", () => {
  it("reads a full submission", () => {
    const result = parseCreateEntryForm(
      formWith({
        rating: "6",
        note: "  good day  ",
        sleepHours: "7.5",
        exercised: "yes",
        tagIds: [UUID],
        newTagNames: ["gardening"],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({
      rating: 6,
      note: "good day",
      sleepHours: 7.5,
      exercised: true,
      tagIds: [UUID],
      newTagNames: ["gardening"],
    });
  });

  it("treats a blank note as absent rather than an empty string", () => {
    const result = parseCreateEntryForm(formWith({ note: "   " }));
    expect(result.success && result.data.note).toBeNull();
  });

  it("treats blank sleep as absent", () => {
    const result = parseCreateEntryForm(formWith({ sleepHours: "" }));
    expect(result.success && result.data.sleepHours).toBeNull();
  });

  it("distinguishes an unanswered exercise question from a no", () => {
    const unanswered = parseCreateEntryForm(formWith());
    expect(unanswered.success && unanswered.data.exercised).toBeNull();

    const no = parseCreateEntryForm(formWith({ exercised: "no" }));
    expect(no.success && no.data.exercised).toBe(false);
  });

  /*
   * The "Not recorded" radio carries an empty string, so the form now always
   * sends the field rather than omitting it. That is a different input from
   * absence and has to reach the same null.
   */
  it("reads an explicit empty exercise value as unanswered", () => {
    const explicit = parseCreateEntryForm(formWith({ exercised: "" }));
    expect(explicit.success && explicit.data.exercised).toBeNull();
  });

  it("reports a missing rating instead of coercing it", () => {
    const formData = new FormData();
    expect(fieldErrors(formData).rating).toEqual([
      "Choose how you're feeling.",
    ]);
  });

  it("reports non-numeric sleep instead of silently dropping it", () => {
    expect(fieldErrors(formWith({ sleepHours: "eight" })).sleepHours).toEqual([
      "Enter sleep as a number of hours.",
    ]);
  });

  it("rejects sleep above the ceiling the CHECK constraint enforces", () => {
    const errors = fieldErrors(
      formWith({ sleepHours: String(MAX_SLEEP_HOURS + 1) }),
    );
    expect(errors.sleepHours?.[0]).toContain(String(MAX_SLEEP_HOURS));
  });
});
