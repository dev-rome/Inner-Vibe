import type { ComponentProps } from "react";

const tile = [
  // transition-all, not transition-colors: the selected tile lifts and grows,
  // and colour alone would snap those.
  "ease-out flex aspect-square w-full items-center justify-center rounded-md border text-2xl transition-all duration-state sm:text-3xl",
  "border-line bg-surface-sunken",
  // The interaction people perform every day, so it answers before it is
  // chosen. Transform and shadow only, both cheap and both removed by the
  // global reduced-motion rule.
  "peer-hover:border-line-strong peer-hover:-translate-y-0.5 peer-hover:shadow-md",
  // The daily interaction, so it gets to feel like something. Scale and
  // translate only, both compositor properties, both killed by the global
  // reduced-motion rule.
  "peer-checked:-translate-y-0.5 peer-checked:scale-105 peer-checked:shadow-md",
  // accent-pressed, not accent: coral-600 is 3.04:1 against the page where
  // coral-500 is 2.44:1, so the boundary stays perceivable.
  "peer-checked:border-accent-pressed peer-checked:bg-accent",
  "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
].join(" ");

type MoodTileProps = Omit<ComponentProps<"input">, "type" | "className"> & {
  emoji: string;
  label: string;
  /** Applied to the visible tile, not the hidden input. */
  className?: string;
};

/**
 * A real radio, so arrow keys and a single tab stop per group come from the
 * platform. The emoji is aria-hidden; `label` is the accessible name, or a
 * screen reader announces a codepoint name instead of a mood.
 */
export function MoodTile({
  emoji,
  label,
  className = "",
  disabled,
  ...props
}: MoodTileProps) {
  return (
    <label className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
      <input
        type="radio"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span className={`${tile} ${className}`}>
        <span aria-hidden="true">{emoji}</span>
        <span className="sr-only">{label}</span>
      </span>
    </label>
  );
}
