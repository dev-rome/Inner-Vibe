import { describe, expect, it } from "vitest";
import { buildJournalHref, parseJournalParams } from "./journal";

const UUID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("parseJournalParams", () => {
  it("reads a full filter set", () => {
    expect(
      parseJournalParams({
        tag: UUID,
        mood: "5",
        from: "2026-07-01",
        to: "2026-07-31",
      }),
    ).toEqual({
      tag: UUID,
      mood: 5,
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("returns nothing for an empty query", () => {
    expect(parseJournalParams({})).toEqual({});
  });

  /*
   * A stale or hand-edited link should show an unfiltered journal, not an
   * error page. Each bad value drops out and the good ones survive.
   */
  it.each([
    ["tag", { tag: "not-a-uuid" }],
    ["mood below range", { mood: "0" }],
    ["mood above range", { mood: "7" }],
    ["mood non-numeric", { mood: "cheerful" }],
    ["from", { from: "27-07-2026" }],
    ["to", { to: "yesterday" }],
  ])("drops an invalid %s", (_label, raw) => {
    expect(parseJournalParams(raw)).toEqual({});
  });

  it("keeps valid filters when another is invalid", () => {
    expect(parseJournalParams({ tag: UUID, mood: "99" })).toEqual({
      tag: UUID,
    });
  });

  it("takes the first of a repeated param", () => {
    expect(parseJournalParams({ mood: ["4", "6"] })).toEqual({ mood: 4 });
  });

  it("ignores unknown params", () => {
    expect(parseJournalParams({ sort: "asc", evil: "1" })).toEqual({});
  });
});

describe("buildJournalHref", () => {
  it("returns the bare path with no filters", () => {
    expect(buildJournalHref({}, {})).toBe("/dashboard/journal");
  });

  it("adds a filter while keeping the others", () => {
    expect(buildJournalHref({ mood: 5 }, { tag: UUID })).toBe(
      `/dashboard/journal?tag=${UUID}&mood=5`,
    );
  });

  it("clears a filter when passed undefined", () => {
    expect(buildJournalHref({ tag: UUID, mood: 5 }, { tag: undefined })).toBe(
      "/dashboard/journal?mood=5",
    );
  });

  /*
   * A cursor names a row in the old result set. Carrying it into a new filter
   * would start the first page partway through, silently hiding entries.
   */
  it("never carries a cursor across a filter change", () => {
    const href = buildJournalHref(
      { mood: 5, cursor: "2026-07-27T00:00:00Z|abc" },
      { tag: UUID },
    );
    expect(href).not.toContain("cursor");
  });
});
