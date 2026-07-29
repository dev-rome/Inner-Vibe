"use client";

import { updateEntryAction } from "@/app/dashboard/journal/actions";
import type { EntrySubmission } from "@/app/dashboard/form-state";
import type { Tag } from "@/lib/data/tags";
import { EntryForm } from "./entry-form";

/**
 * Binds the entry id to the update action.
 *
 * bind rather than a hidden input: the id then travels in the encrypted action
 * reference instead of the page HTML, so it cannot be swapped for someone
 * else's before submitting. RLS would reject that anyway, but not sending it
 * is a shorter path than relying on the check.
 */
export function EditEntryForm({
  id,
  tags,
  values,
}: {
  id: string;
  tags: Tag[];
  values: EntrySubmission;
}) {
  return (
    <EntryForm
      tags={tags}
      action={updateEntryAction.bind(null, id)}
      initialValues={values}
      heading="Edit entry"
      submitLabel="Save changes"
      pendingLabel="Saving…"
      clearOnSuccess={false}
    />
  );
}
