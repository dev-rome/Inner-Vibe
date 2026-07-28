"use client";

import { useActionState, useState } from "react";
import { createEntryAction } from "@/app/dashboard/actions";
import { initialEntryFormState } from "@/app/dashboard/form-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Textarea } from "@/components/ui/input";
import { MoodSelector } from "./mood-selector";
import { TagPicker } from "./tag-picker";
import type { Tag } from "@/lib/data/tags";
import { MAX_NOTE_LENGTH, MAX_SLEEP_HOURS } from "@/lib/validation/entry";

type EntryFormProps = {
  tags: Tag[];
};

export function EntryForm({ tags }: EntryFormProps) {
  // No `pending` here: the Save button reads it from useFormStatus instead, so
  // only the button re-renders while the action is in flight.
  const [state, formAction] = useActionState(
    createEntryAction,
    initialEntryFormState,
  );

  /*
   * Remounting the form is how it gets cleared, since form.reset() would leave
   * TagPicker's pending tags and the note counter behind.
   *
   * The key must advance only on success. Deriving it from state.savedAt is a
   * bug: a failed submit sets savedAt back to null, the key flips back, and
   * the form throws away everything the user typed.
   */
  const [formKey, setFormKey] = useState(0);
  const [handledSaveAt, setHandledSaveAt] = useState<number | null>(null);

  if (state.savedAt !== null && state.savedAt !== handledSaveAt) {
    setHandledSaveAt(state.savedAt);
    setFormKey(formKey + 1);
  }

  return (
    <section aria-labelledby="entry-form-heading">
      <h2 id="entry-form-heading" className="sr-only">
        Log a mood entry
      </h2>

      {/* Outside the keyed form: a live region only announces changes to
          content it already contains, so remounting it would say nothing. */}
      <p
        aria-live="polite"
        className={`min-h-6 text-sm ${
          state.status === "error" ? "text-status-error" : "text-accent-strong"
        }`}
      >
        {state.message}
      </p>

      <form key={formKey} action={formAction} className="flex flex-col gap-8">
        <MoodSelector
          name="rating"
          errorId="rating-error"
          hasError={Boolean(state.fieldErrors.rating)}
        />
        <FieldError id="rating-error" messages={state.fieldErrors.rating} />

        <NoteField error={state.fieldErrors.note} />

        <fieldset>
          <legend className="text-ink text-base font-medium">
            Anything that might have played a part?
          </legend>
          <p className="text-muted mt-1 text-sm">Optional.</p>

          <div className="mt-3 flex flex-wrap items-end gap-6">
            <div>
              <label htmlFor="sleepHours" className="text-muted block text-sm">
                Hours slept
              </label>
              <Input
                id="sleepHours"
                name="sleepHours"
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                max={MAX_SLEEP_HOURS}
                placeholder="7.5"
                aria-describedby={
                  state.fieldErrors.sleepHours ? "sleep-error" : undefined
                }
                aria-invalid={
                  Boolean(state.fieldErrors.sleepHours) || undefined
                }
                className="mt-1.5 w-28 font-mono tabular-nums"
              />
            </div>

            {/* Yes/No rather than a checkbox: unanswered has to stay null, and
                a checkbox would record every skipped question as "no".
                Neutral selected state — this is not on the coral allowlist. */}
            <fieldset>
              <legend className="text-muted text-sm">Exercised?</legend>
              <div className="mt-1.5 flex gap-2">
                {[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ].map((choice) => (
                  <label key={choice.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="exercised"
                      value={choice.value}
                      className="peer sr-only"
                    />
                    <span
                      className={[
                        "ease-standard inline-flex rounded-md border px-4 py-2 text-sm transition-colors duration-150",
                        "border-line bg-surface-raised text-ink hover:border-line-strong",
                        "peer-checked:border-line-strong peer-checked:bg-surface-sunken peer-checked:font-medium",
                        "peer-checked:before:mr-1.5 peer-checked:before:content-['✓']",
                        "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                      ].join(" ")}
                    >
                      {choice.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <FieldError
            id="sleep-error"
            messages={state.fieldErrors.sleepHours}
          />
        </fieldset>

        <TagPicker tags={tags} />
        <FieldError
          id="new-tag-error"
          messages={state.fieldErrors.newTagNames}
        />

        <div>
          <SubmitButton pendingLabel="Saving…">Save entry</SubmitButton>
        </div>
      </form>
    </section>
  );
}

// Separate component so the character count resets with the keyed form.
function NoteField({ error }: { error?: string[] }) {
  const [length, setLength] = useState(0);
  const nearLimit = length > MAX_NOTE_LENGTH * 0.8;

  return (
    <div>
      <label htmlFor="note" className="text-ink text-base font-medium">
        Want to say more?
      </label>
      <p className="text-muted mt-1 text-sm">Optional. Just for you.</p>

      <Textarea
        id="note"
        name="note"
        rows={4}
        maxLength={MAX_NOTE_LENGTH}
        onChange={(event) => setLength(event.target.value.length)}
        aria-describedby={error ? "note-error" : undefined}
        aria-invalid={Boolean(error) || undefined}
        className="mt-3 w-full text-lg"
      />

      {/* maxLength stops typing dead, which reads as a broken keyboard without
          a visible count. */}
      {nearLimit && (
        <p
          aria-live="polite"
          className="text-subtle mt-1 text-right font-mono text-xs tabular-nums"
        >
          {length} / {MAX_NOTE_LENGTH}
        </p>
      )}

      <FieldError id="note-error" messages={error} />
    </div>
  );
}

// First problem only. A stack of messages per field is noise.
function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages || messages.length === 0) return null;

  return (
    <p id={id} className="text-status-error mt-1.5 text-sm">
      {messages[0]}
    </p>
  );
}
