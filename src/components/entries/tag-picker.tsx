"use client";

import { useRef, useState } from "react";
import type { Tag } from "@/lib/data/tags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagCheckbox } from "@/components/ui/tag";
import { MAX_TAG_NAME_LENGTH } from "@/lib/validation/entry";

type TagPickerProps = {
  tags: Tag[];
};

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
          <TagCheckbox
            key={tag.id}
            name="tagIds"
            value={tag.id}
            label={tag.name}
          />
        ))}

        {/*
         * Pending new tags are the same control, checked. They used to be
         * hidden inputs in their own chip with a × button, which put a remove
         * control on one selected chip and not the others for no reason a user
         * could see. Unticking discards the name.
         */}
        {newNames.map((name) => (
          <TagCheckbox
            key={name}
            name="newTagNames"
            value={name}
            label={name}
            defaultChecked
            onChange={(event) => {
              if (!event.target.checked) removeNewTag(name);
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <label htmlFor="new-tag" className="sr-only">
          Add a new tag
        </label>
        <Input
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
          className="min-w-0 flex-1 text-sm"
        />
        {/* aria-disabled, not disabled, so the control stays in the tab order
            and remains discoverable. addTag already no-ops on an empty name. */}
        <Button
          variant="secondary"
          size="sm"
          onClick={addTag}
          aria-disabled={draft.trim() === "" || undefined}
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
