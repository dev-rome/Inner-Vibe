import { describe, expect, it } from "vitest";
import {
  MIN_GAP,
  MIN_SAMPLE,
  contextLine,
  deriveInsight,
} from "./insights-copy";
import type { ExerciseComparison, SleepComparison } from "@/lib/data/insights";

function summary(totalEntries: number, recentEntries: number) {
  return { totalEntries, recentEntries, firstLogged: null };
}

describe("contextLine", () => {
  it("counts this week", () => {
    expect(contextLine(summary(48, 12))).toBe(
      "You've logged 12 times this week.",
    );
  });

  it("agrees in number", () => {
    expect(contextLine(summary(3, 1))).toBe("You've logged 1 time this week.");
  });

  // A quiet week is not a failed week, so the copy points at what is still
  // there rather than at the gap.
  it("does not scold a quiet week", () => {
    expect(contextLine(summary(30, 0))).toBe(
      "Nothing logged in the last week. Everything earlier is still here.",
    );
  });

  it("invites on a first visit", () => {
    expect(contextLine(summary(0, 0))).toBe(
      "Your patterns will appear here as you log.",
    );
  });
});

const exercised = (average: number, count: number): ExerciseComparison => ({
  exercised: true,
  average,
  count,
});

const didNot = (average: number, count: number): ExerciseComparison => ({
  exercised: false,
  average,
  count,
});

const slept = (
  bucket: SleepComparison["bucket"],
  average: number,
  count: number,
): SleepComparison => ({ bucket, average, count });

describe("deriveInsight", () => {
  it("reports the side that ran higher", () => {
    const insight = deriveInsight([exercised(4.6, 9), didNot(3.4, 12)], []);
    expect(insight?.observation).toBe(
      "Your mood has been higher on the days you moved.",
    );
  });

  it("reads the other direction just as plainly", () => {
    const insight = deriveInsight([exercised(3.0, 8), didNot(4.5, 8)], []);
    expect(insight?.observation).toBe(
      "Your mood has been higher on the days you did not exercise.",
    );
  });

  it("names the sleep band", () => {
    const insight = deriveInsight(
      [],
      [slept("under_6", 2.9, 6), slept("eight_plus", 4.8, 5)],
    );
    expect(insight?.observation).toBe(
      "Your mood has been higher after 8h or more of sleep.",
    );
  });

  /*
   * The refusals matter more than the findings. A card that always produces an
   * observation is a card that invents them, and this app does not diagnose.
   */
  it("says nothing when one side is below the sample floor", () => {
    const thin = MIN_SAMPLE - 1;
    expect(deriveInsight([exercised(6, 20), didNot(1, thin)], [])).toBeNull();
  });

  it("says nothing when only one side was recorded", () => {
    expect(deriveInsight([exercised(4.6, 30)], [])).toBeNull();
  });

  it("says nothing when the gap is too small to mean anything", () => {
    const insight = deriveInsight(
      [exercised(4.0, 10), didNot(4.0 - (MIN_GAP - 0.1), 10)],
      [],
    );
    expect(insight).toBeNull();
  });

  it("says nothing at all with no data", () => {
    expect(deriveInsight([], [])).toBeNull();
  });

  it("prefers whichever gap is wider", () => {
    const insight = deriveInsight(
      // 0.6 apart
      [exercised(4.0, 10), didNot(3.4, 10)],
      // 1.9 apart, so sleep wins
      [slept("under_6", 2.9, 6), slept("eight_plus", 4.8, 6)],
    );
    expect(insight?.observation).toContain("sleep");
  });

  // The hedge is not decoration. It is what keeps a description from being
  // read as a diagnosis.
  it("carries its sample size and refuses to claim cause", () => {
    const insight = deriveInsight([exercised(4.6, 9), didNot(3.4, 12)], []);
    expect(insight?.basis).toBe("From 21 entries. A pattern, not a cause.");
  });
});
