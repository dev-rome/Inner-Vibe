import { describe, expect, it } from "vitest";
import {
  TINT_FLOOR,
  TINT_RANGE,
  groupByMonth,
  moodTint,
} from "./journal-grouping";
import type { Entry } from "@/lib/data/entries";
import { MAX_RATING, MIN_RATING } from "@/lib/validation/entry";

function entry(id: string, loggedAt: string, rating = 4): Entry {
  return {
    id,
    rating,
    note: null,
    sleepHours: null,
    exercised: null,
    loggedAt: new Date(loggedAt),
    tags: [],
  };
}

describe("moodTint", () => {
  // A low day still gets colour. Rendering it as absent would be the app
  // grading it, which is the one thing the palette rules forbid.
  it("never fades the lowest mood to nothing", () => {
    expect(moodTint(MIN_RATING)).toBe(TINT_FLOOR);
    expect(moodTint(MIN_RATING)).toBeGreaterThan(0);
  });

  it("reaches full strength at the top of the scale", () => {
    expect(moodTint(MAX_RATING)).toBe(TINT_FLOOR + TINT_RANGE);
  });

  it("rises with the rating", () => {
    const tints = [1, 2, 3, 4, 5, 6].map(moodTint);
    const sorted = [...tints].sort((a, b) => a - b);
    expect(tints).toEqual(sorted);
    expect(new Set(tints).size).toBe(tints.length);
  });

  // A rating outside the scale is a bug elsewhere, not a reason to emit a
  // colour outside the palette.
  it.each([0, -3, 7, 99])("clamps %p into the scale", (rating) => {
    const tint = moodTint(rating);
    expect(tint).toBeGreaterThanOrEqual(TINT_FLOOR);
    expect(tint).toBeLessThanOrEqual(TINT_FLOOR + TINT_RANGE);
  });
});

describe("groupByMonth", () => {
  it("returns nothing for no entries", () => {
    expect(groupByMonth([], "UTC")).toEqual([]);
  });

  it("keeps one month as one group", () => {
    const groups = groupByMonth(
      [
        entry("a", "2026-07-29T18:00:00Z"),
        entry("b", "2026-07-28T18:00:00Z"),
        entry("c", "2026-07-02T18:00:00Z"),
      ],
      "UTC",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("July 2026");
    expect(groups[0].entries.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("starts a new group at a month boundary", () => {
    const groups = groupByMonth(
      [entry("a", "2026-07-01T12:00:00Z"), entry("b", "2026-06-30T12:00:00Z")],
      "UTC",
    );

    expect(groups.map((g) => g.label)).toEqual(["July 2026", "June 2026"]);
  });

  it("separates the same month in different years", () => {
    const groups = groupByMonth(
      [entry("a", "2026-07-02T12:00:00Z"), entry("b", "2025-07-30T12:00:00Z")],
      "UTC",
    );

    expect(groups.map((g) => g.label)).toEqual(["July 2026", "July 2025"]);
  });

  /*
   * The reason grouping takes a timezone at all.
   *
   * 18:00 UTC on the last of July is still 19:00 that evening in London, which
   * is on BST and only an hour ahead — but it is already 03:00 on the first of
   * August in Tokyo. One instant, two months, so the heading has to follow the
   * writer rather than the server.
   */
  it("groups by the reader's zone, not the server's", () => {
    const lastEvening = [entry("a", "2026-07-31T18:00:00Z")];

    expect(groupByMonth(lastEvening, "Europe/London")[0].label).toBe(
      "July 2026",
    );
    expect(groupByMonth(lastEvening, "Asia/Tokyo")[0].label).toBe(
      "August 2026",
    );
  });

  it("preserves the order the query returned", () => {
    const groups = groupByMonth(
      [
        entry("a", "2026-07-29T12:00:00Z"),
        entry("b", "2026-07-27T12:00:00Z"),
        entry("c", "2026-06-30T12:00:00Z"),
        entry("d", "2026-06-01T12:00:00Z"),
      ],
      "UTC",
    );

    expect(groups.flatMap((g) => g.entries).map((e) => e.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  /*
   * Only the previous group is checked, so a month that reappears after a gap
   * gets its own heading. Merging them would put January below February under
   * one label, which reads as a single stretch of time that never happened.
   */
  it("does not reopen an earlier month after a gap", () => {
    const groups = groupByMonth(
      [
        entry("a", "2026-07-29T12:00:00Z"),
        entry("b", "2026-06-15T12:00:00Z"),
        entry("c", "2025-07-15T12:00:00Z"),
      ],
      "UTC",
    );

    expect(groups.map((g) => g.label)).toEqual([
      "July 2026",
      "June 2026",
      "July 2025",
    ]);
  });
});
