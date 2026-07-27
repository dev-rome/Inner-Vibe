export const MOOD_OPTIONS = [
  { value: 1, emoji: "\u{1F61E}", label: "Very low" },
  { value: 2, emoji: "\u{1F614}", label: "Low" },
  { value: 3, emoji: "\u{1F615}", label: "Slightly low" },
  { value: 4, emoji: "\u{1F642}", label: "Slightly good" },
  { value: 5, emoji: "\u{1F60A}", label: "Good" },
  { value: 6, emoji: "\u{1F604}", label: "Very good" },
] as const;

export type MoodOption = (typeof MOOD_OPTIONS)[number];

/** Look up the presentation for a stored rating. Undefined if out of range. */
export function moodForRating(rating: number): MoodOption | undefined {
  return MOOD_OPTIONS.find((option) => option.value === rating);
}
