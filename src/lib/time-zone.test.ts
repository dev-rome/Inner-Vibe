import { describe, expect, it } from "vitest";
import {
  endOfDay,
  isValidTimeZone,
  startOfDay,
  toZonedIsoDate,
} from "./time-zone";

describe("isValidTimeZone", () => {
  it.each(["UTC", "America/New_York", "Europe/London", "Asia/Kolkata"])(
    "accepts %s",
    (zone) => expect(isValidTimeZone(zone)).toBe(true),
  );

  it.each(["", "Mars/Olympus", "GMT+25", "not a zone"])("rejects %p", (zone) =>
    expect(isValidTimeZone(zone)).toBe(false),
  );
});

describe("startOfDay", () => {
  it("is midnight UTC for UTC", () => {
    expect(startOfDay("2026-07-27", "UTC").toISOString()).toBe(
      "2026-07-27T00:00:00.000Z",
    );
  });

  // New York is UTC-4 in July, so its midnight is 04:00 UTC the same day.
  it("shifts forward for a zone behind UTC", () => {
    expect(startOfDay("2026-07-27", "America/New_York").toISOString()).toBe(
      "2026-07-27T04:00:00.000Z",
    );
  });

  // Tokyo is UTC+9 year round, so its midnight is 15:00 UTC the day before.
  it("shifts back for a zone ahead of UTC", () => {
    expect(startOfDay("2026-07-27", "Asia/Tokyo").toISOString()).toBe(
      "2026-07-26T15:00:00.000Z",
    );
  });

  it("handles a half-hour offset", () => {
    expect(startOfDay("2026-07-27", "Asia/Kolkata").toISOString()).toBe(
      "2026-07-26T18:30:00.000Z",
    );
  });

  /*
   * The reason startOfDay makes two passes. Guessing from the offset at UTC
   * midnight lands on the wrong side of these transitions, and a single-pass
   * implementation is off by an hour on exactly these days.
   */
  it("is correct on the day daylight saving starts", () => {
    // US DST began 2026-03-08. Midnight is still EST (UTC-5).
    expect(startOfDay("2026-03-08", "America/New_York").toISOString()).toBe(
      "2026-03-08T05:00:00.000Z",
    );
  });

  it("is correct on the day daylight saving ends", () => {
    // US DST ended 2026-11-01. Midnight is still EDT (UTC-4).
    expect(startOfDay("2026-11-01", "America/New_York").toISOString()).toBe(
      "2026-11-01T04:00:00.000Z",
    );
  });

  it("is correct the day after a transition", () => {
    expect(startOfDay("2026-03-09", "America/New_York").toISOString()).toBe(
      "2026-03-09T04:00:00.000Z",
    );
  });
});

describe("endOfDay", () => {
  it("is the next day's start, so the range is half-open", () => {
    expect(endOfDay("2026-07-27", "America/New_York").toISOString()).toBe(
      startOfDay("2026-07-28", "America/New_York").toISOString(),
    );
  });

  it("spans 23 hours across a spring-forward day", () => {
    const start = startOfDay("2026-03-08", "America/New_York");
    const end = endOfDay("2026-03-08", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });

  it("spans 25 hours across a fall-back day", () => {
    const start = startOfDay("2026-11-01", "America/New_York");
    const end = endOfDay("2026-11-01", "America/New_York");
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25);
  });

  it("rolls over a month boundary", () => {
    expect(endOfDay("2026-07-31", "UTC").toISOString()).toBe(
      "2026-08-01T00:00:00.000Z",
    );
  });

  it("rolls over a year boundary", () => {
    expect(endOfDay("2026-12-31", "UTC").toISOString()).toBe(
      "2027-01-01T00:00:00.000Z",
    );
  });
});

describe("toZonedIsoDate", () => {
  /*
   * The bug the whole timezone decision exists to prevent: an entry logged at
   * 9pm in New York is already tomorrow in UTC, so grouping on the raw
   * timestamp files it under the wrong day.
   */
  it("keeps a late evening entry on the local day", () => {
    const ninePmNewYork = new Date("2026-07-28T01:00:00.000Z");

    expect(toZonedIsoDate(ninePmNewYork, "UTC")).toBe("2026-07-28");
    expect(toZonedIsoDate(ninePmNewYork, "America/New_York")).toBe(
      "2026-07-27",
    );
  });

  it("round-trips with startOfDay", () => {
    const zone = "Europe/London";
    const start = startOfDay("2026-07-27", zone);
    expect(toZonedIsoDate(start, zone)).toBe("2026-07-27");
  });

  it("round-trips at the last instant of a day", () => {
    const zone = "Asia/Tokyo";
    const lastMs = new Date(endOfDay("2026-07-27", zone).getTime() - 1);
    expect(toZonedIsoDate(lastMs, zone)).toBe("2026-07-27");
  });
});
