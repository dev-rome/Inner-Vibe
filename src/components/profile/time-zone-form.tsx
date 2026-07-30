"use client";

import { useActionState, useState } from "react";
import { saveTimeZoneAction } from "@/app/dashboard/profile/actions";
import { initialSettingsFormState } from "@/app/dashboard/profile/form-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { fieldClasses } from "@/components/ui/input";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zone";

/**
 * Timezone picker.
 *
 * The list comes from the runtime rather than a bundled table, so it cannot
 * drift from what Intl will actually accept when formatting.
 *
 * "Use my device's timezone" is a convenience, not the storage mechanism: the
 * chosen value is still saved to the profile, so it holds across devices and
 * a trip does not silently re-bucket months of history.
 */
export function TimeZoneForm({ current }: { current: string }) {
  const [state, formAction] = useActionState(
    saveTimeZoneAction,
    initialSettingsFormState,
  );
  const [selected, setSelected] = useState(current);

  // useState only reads its argument on mount, so after a save the server
  // sends the new value down but the control keeps showing the old one.
  // Adjusting during render is React's documented fix for state derived from
  // a prop; React re-runs before committing, so there is no flash.
  const [lastSaved, setLastSaved] = useState(current);
  if (current !== lastSaved) {
    setLastSaved(current);
    setSelected(current);
  }

  /*
   * supportedValuesOf returns only canonical region zones — it omits UTC and
   * every Etc/* alias, even though Intl accepts them when formatting. Without
   * adding them back, the stored default is not in the list, the controlled
   * select silently falls back to the first option, and saving would change
   * the user's timezone to Africa/Abidjan without them touching anything.
   */
  const listed = Intl.supportedValuesOf("timeZone");
  const zones = [
    ...new Set([
      ...[DEFAULT_TIME_ZONE, current].filter((zone) => !listed.includes(zone)),
      ...listed,
    ]),
  ];

  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p
        aria-live="polite"
        className={`min-h-6 text-sm ${
          state.status === "error" ? "text-status-error" : "text-accent-strong"
        }`}
      >
        {state.message}
      </p>

      <div>
        <label
          htmlFor="timeZone"
          className="text-ink block text-base font-medium"
        >
          Timezone
        </label>
        <p className="text-muted mt-1 text-sm">
          Decides which day an entry belongs to, and how times are shown.
        </p>

        <select
          id="timeZone"
          name="timeZone"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className={`${fieldClasses} mt-3 w-full`}
        >
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      {detected !== selected && (
        <p className="text-muted text-sm">
          Your device says{" "}
          <span className="text-ink font-medium">{detected}</span>.{" "}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelected(detected)}
          >
            Use that
          </Button>
        </p>
      )}

      <div>
        <SubmitButton pendingLabel="Saving…">Save timezone</SubmitButton>
      </div>
    </form>
  );
}
