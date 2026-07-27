import { MOOD_OPTIONS } from "@/lib/moods";

type MoodSelectorProps = {
  name: string;
  errorId?: string;
  hasError?: boolean;
};

/**
 * Native radios, not buttons with role="radiogroup": arrow-key navigation, a
 * single tab stop and "3 of 6" announcements come free from the platform, and
 * it works without JavaScript.
 *
 * sr-only clips the inputs rather than hiding them, so they stay focusable;
 * display:none or visibility:hidden would drop them from the accessibility
 * tree. The selected and focus states are painted on the sibling span.
 *
 * The emoji is aria-hidden because its accessible name is a codepoint name
 * ("pensive face"), not a mood.
 */
export function MoodSelector({ name, errorId, hasError }: MoodSelectorProps) {
  return (
    <fieldset
      aria-describedby={hasError ? errorId : undefined}
      aria-invalid={hasError || undefined}
    >
      <legend className="text-ink text-base font-medium">
        How are you feeling?
      </legend>

      <div className="mt-3 grid grid-cols-6 gap-1.5 sm:gap-2">
        {MOOD_OPTIONS.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              className="peer sr-only"
            />
            {/* Every unselected tile is identical. Only the selected one takes
                the accent, so no rating is ever coloured as worse. */}
            <span
              className={[
                "ease-standard flex aspect-square w-full items-center justify-center rounded-md border text-2xl transition-colors duration-150 sm:text-3xl",
                "border-line bg-surface-sunken",
                "hover:border-line-strong",
                // Border is accent-pressed, not accent: coral-600 reads at
                // 3.04:1 against the page where coral-500 is only 2.44:1, so
                // the selected tile's boundary is perceivable (WCAG 1.4.11).
                "peer-checked:border-accent-pressed peer-checked:bg-accent",
                "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
              ].join(" ")}
            >
              <span aria-hidden="true">{option.emoji}</span>
              <span className="sr-only">{option.label}</span>
            </span>
          </label>
        ))}
      </div>

      {/* Anchors only. The per-option names are already on the inputs. */}
      <div
        aria-hidden="true"
        className="text-subtle mt-2 flex justify-between text-xs"
      >
        <span>{MOOD_OPTIONS[0].label}</span>
        <span>{MOOD_OPTIONS[MOOD_OPTIONS.length - 1].label}</span>
      </div>
    </fieldset>
  );
}
