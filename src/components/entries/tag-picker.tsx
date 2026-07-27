"use client";

import { useRef, useState } from "react";
import type { Tag } from "@/lib/data/tags";
import { Button } from "@/components/ui/button";
import { MAX_TAG_NAME_LENGTH } from "@/lib/validation/entry";

type TagPickerProps = {
  tags: Tag[];
};

const chipBase =
  "ease-standard inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors duration-150";

/**
 * Existing tags are uncontrolled checkboxes so selection still works with
 * JavaScript disabled; that is why addTag reaches into the DOM to tick a box
 * instead of setting state.
 *
 * New tags are held as pending names and created by the same transaction as
 * the entry, so abandoning the form leaves no orphan tags behind.
 */
export function TagPicker({ tags }: TagPickerProps) {
  const [newNames, setNewNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function addTag() {
    // Lowercase to match how create_entry stores them.
    const name = draft.trim().toLowerCase();

    if (name === "") return;

    const existing = tags.find((tag) => tag.name.toLowerCase() === name);
    if (existing) {
      const boxes =
        listRef.current?.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]',
        ) ?? [];
      const box = Array.from(boxes).find(
        (input) => input.value === existing.id,
      );
      if (box) box.checked = true;

      setDraft("");
      setNotice(`"${existing.name}" is already in your tags, so we picked it.`);
      return;
    }

    if (newNames.includes(name)) {
      setDraft("");
      setNotice(`"${name}" is already on this entry.`);
      return;
    }

    setNewNames((current) => [...current, name]);
    setDraft("");
    setNotice(`Added "${name}".`);
  }

  function removeNewTag(name: string) {
    setNewNames((current) => current.filter((item) => item !== name));
    setNotice(`Removed "${name}".`);
  }

  return (
    <fieldset>
      <legend className="text-ink text-base font-medium">
        What was going on?
      </legend>
      <p className="text-muted mt-1 text-sm">Optional. Pick any that fit.</p>

      <div ref={listRef} className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <label key={tag.id} className="cursor-pointer">
            <input
              type="checkbox"
              name="tagIds"
              value={tag.id}
              className="peer sr-only"
            />
            {/*
             * Neutral selected state. Tags are not on the coral allowlist, so
             * selection is carried by fill, border weight and a check glyph
             * rather than the accent. The glyph also means selection is not
             * signalled by colour alone.
             */}
            <span
              className={[
                chipBase,
                "border-line bg-surface-raised text-ink",
                "hover:border-line-strong",
                "peer-checked:border-line-strong peer-checked:bg-surface-sunken peer-checked:font-medium",
                "peer-checked:before:mr-1 peer-checked:before:content-['✓']",
                "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
              ].join(" ")}
            >
              {tag.name}
            </span>
          </label>
        ))}

        {newNames.map((name) => (
          <span
            key={name}
            className={`${chipBase} border-line-strong bg-surface-sunken text-ink font-medium`}
          >
            <input type="hidden" name="newTagNames" value={name} />
            <span aria-hidden="true">&#10003;</span>
            {name}
            {/* size-6 is 24px, the WCAG 2.5.8 minimum target. The negative
                margin keeps the chip from growing to accommodate it. */}
            <button
              type="button"
              onClick={() => removeNewTag(name)}
              aria-label={`Remove ${name}`}
              className="text-muted hover:bg-line hover:text-ink ease-standard -mr-1.5 inline-flex size-6 items-center justify-center rounded-full transition-colors duration-150"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <label htmlFor="new-tag" className="sr-only">
          Add a new tag
        </label>
        <input
          id="new-tag"
          type="text"
          value={draft}
          maxLength={MAX_TAG_NAME_LENGTH}
          placeholder="Add your own"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter would otherwise submit the form.
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          className="border-field bg-surface-raised text-ink placeholder:text-subtle min-w-0 flex-1 rounded-sm border px-3 py-2 text-sm"
        />
        {/* aria-disabled, not disabled, so the control stays in the tab order
            and remains discoverable. addTag already no-ops on an empty name. */}
        <Button
          variant="secondary"
          onClick={addTag}
          aria-disabled={draft.trim() === "" || undefined}
          className="px-4 py-2 text-sm"
        >
          Add
        </Button>
      </div>

      <p role="status" aria-live="polite" className="text-muted mt-2 text-sm">
        {notice}
      </p>
    </fieldset>
  );
}
