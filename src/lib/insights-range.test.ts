import { describe, expect, it } from "vitest";
import {
  bucketFor,
  datesInWindow,
  isRange,
  resolveRange,
} from "./insights-range";

// Mid-afternoon UTC, deliberately not midnight, so a window that ignored the
// time of day would show up.
const NOW = new Date("2026-07-27T15:00:00.000Z");

describe("isRange", () => {
  it.each(["week", "month", "year"])("accepts %s", (value) =>
    expect(isRange(value)).toBe(true),
  );

  it.each(["day", "", "WEEK", null, 7])("rejects %p", (value) =>
    expect(isRange(value)).toBe(false),
  );
});

describe("bucketFor", () => {
  it("plots a year weekly and everything else daily", () => {
    expect(bucketFor("week")).toBe("day");
    expect(bucketFor("month")).toBe("day");
    expect(bucketFor("year")).toBe("week");
  });
});

describe("resolveRange", () => {
  it("ends at the first instant of tomorrow, so today is included", () => {
    const { to, toDate } = resolveRange("week", "UTC", NOW);
    expect(toDate).toBe("2026-07-27");
    expect(to.toISOString()).toBe("2026-07-28T00:00:00.000Z");
  });

  it("spans the requested number of days", () => {
    for (const [range, days] of [
      ["week", 7],
      ["month", 30],
      ["year", 365],
    ] as const) {
      const window = resolveRange(range, "UTC", NOW);
      const spanned =
        (window.to.getTime() - window.from.getTime()) / 86_400_000;
      expect(spanned).toBe(days);
    }
  });

  /*
   * The window is resolved in the user's zone, not UTC. Late afternoon UTC is
   * already tomorrow in Tokyo, so the range has to end a day later there.
   */
  it("resolves the end date in the user's zone", () => {
    const utc = resolveRange("week", "UTC", new Date("2026-07-27T16:00:00Z"));
    const tokyo = resolveRange(
      "week",
      "Asia/Tokyo",
      new Date("2026-07-27T16:00:00Z"),
    );

    expect(utc.toDate).toBe("2026-07-27");
    expect(tokyo.toDate).toBe("2026-07-28");
  });

  it("keeps a whole number of days across a daylight-saving change", () => {
    // US DST ended 2026-11-01, inside this window.
    const window = resolveRange(
      "week",
      "America/New_York",
      new Date("2026-11-03T18:00:00Z"),
    );
    const hours = (window.to.getTime() - window.from.getTime()) / 3_600_000;

    // 7 days containing one extra hour, which is what a real week was.
    expect(hours).toBe(7 * 24 + 1);
  });
});

describe("datesInWindow", () => {
  it("returns one entry per day, oldest first", () => {
    const window = resolveRange("week", "UTC", NOW);
    const dates = datesInWindow(window, "UTC");

    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe("2026-07-21");
    expect(dates.at(-1)).toBe("2026-07-27");
  });

  it("has no duplicates or gaps across a daylight-saving change", () => {
    const zone = "America/New_York";
    const window = resolveRange(
      "week",
      zone,
      new Date("2026-11-03T18:00:00Z"),
    );
    const dates = datesInWindow(window, zone);

    expect(dates).toHaveLength(7);
    expect(new Set(dates).size).toBe(7);
    expect(dates).toContain("2026-11-01");
  });

  it("covers a full month range", () => {
    const window = resolveRange("month", "UTC", NOW);
    expect(datesInWindow(window, "UTC")).toHaveLength(30);
  });
});
