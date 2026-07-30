import { describe, expect, it } from "vitest";
import { greeting, hourIn, partOfDay } from "./greeting";

describe("partOfDay", () => {
  it.each([
    [5, "morning"],
    [8, "morning"],
    [11, "morning"],
    [12, "afternoon"],
    [17, "afternoon"],
    [18, "evening"],
    [23, "evening"],
  ])("calls %i %s", (hour, expected) => {
    expect(partOfDay(hour)).toBe(expected);
  });

  // The small hours are the end of a long night, not the start of a morning.
  it.each([0, 3, 4])("calls %i evening rather than morning", (hour) => {
    expect(partOfDay(hour)).toBe("evening");
  });
});

describe("hourIn", () => {
  // 18:00 UTC is a different part of the day in each of these, which is the
  // whole reason the greeting cannot read the server's clock.
  const instant = new Date("2026-07-29T18:00:00Z");

  it.each([
    ["UTC", 18],
    ["Europe/London", 19],
    ["America/New_York", 14],
    ["Asia/Tokyo", 3],
  ])("reads %s as hour %i", (zone, expected) => {
    expect(hourIn(zone, instant)).toBe(expected);
  });

  it("reads midnight as 0 rather than 24", () => {
    expect(hourIn("UTC", new Date("2026-07-29T00:30:00Z"))).toBe(0);
  });
});

describe("greeting", () => {
  const evening = new Date("2026-07-29T18:00:00Z");

  it("uses the name when there is one", () => {
    expect(greeting("Rome", "UTC", evening)).toBe("Good evening, Rome");
  });

  it("stands alone when there is not", () => {
    expect(greeting(null, "UTC", evening)).toBe("Good evening");
  });

  /*
   * One instant, three zones, three different greetings. 21:00 UTC is 06:00 in
   * Tokyo, 17:00 in New York and 22:00 in London, which is the clearest way to
   * show the greeting follows the reader rather than the server.
   */
  it.each([
    ["Asia/Tokyo", "Good morning, Rome"],
    ["America/New_York", "Good afternoon, Rome"],
    ["Europe/London", "Good evening, Rome"],
  ])("greets by the reader's zone, not the server's (%s)", (zone, expected) => {
    const instant = new Date("2026-07-29T21:00:00Z");
    expect(greeting("Rome", zone, instant)).toBe(expected);
  });

  // 03:00 is still the same night, not a new morning.
  it("greets the small hours as evening", () => {
    const lateNight = new Date("2026-07-29T03:00:00Z");
    expect(greeting(null, "UTC", lateNight)).toBe("Good evening");
  });
});
