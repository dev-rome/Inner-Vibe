import { MOOD_OPTIONS } from "@/lib/moods";
import { MoodTile } from "@/components/ui/mood-tile";

type MoodSelectorProps = {
  name: string;
  errorId?: string;
  hasError?: boolean;
};

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
          <MoodTile key={option.value} name={name} {...option} />
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
