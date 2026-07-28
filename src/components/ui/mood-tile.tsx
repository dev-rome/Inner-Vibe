/**
 * One point on the mood scale.
 *
 * A real radio input, visually hidden with sr-only and painted through its
 * sibling span. That buys arrow-key navigation, a single tab stop for the
 * group, "3 of 6" announcements and no-JS operation from the platform rather
 * than from hand-written key handling. sr-only clips rather than hides, so the
 * input stays focusable; display:none would drop it from the a11y tree.
 *
 * The emoji is aria-hidden and `label` is the accessible name, or a screen
 * reader announces "pensive face" — a codepoint name, not a mood.
 *
 * Unselected tiles are identical to one another. Only the selected one takes
 * the accent, so no rating is ever coloured as the worse one. Its border is
 * accent-pressed rather than accent: coral-600 reads at 3.04:1 against the
 * page where coral-500 is 2.44:1, so the boundary stays perceivable.
 */
export function MoodTile({
  name,
  value,
  emoji,
  label,
  defaultChecked,
}: {
  name: string;
  value: number;
  emoji: string;
  label: string;
  /** Uncontrolled, so editing an existing entry can preselect its rating. */
  defaultChecked?: boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        className={[
          "ease-standard flex aspect-square w-full items-center justify-center rounded-md border text-2xl transition-colors duration-150 sm:text-3xl",
          "border-line bg-surface-sunken",
          "hover:border-line-strong",
          "peer-checked:border-accent-pressed peer-checked:bg-accent",
          "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
        ].join(" ")}
      >
        <span aria-hidden="true">{emoji}</span>
        <span className="sr-only">{label}</span>
      </span>
    </label>
  );
}
