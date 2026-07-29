"use client";

import { useState } from "react";
import { deleteEntryAction } from "@/app/dashboard/journal/actions";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Two-step delete.
 *
 * Deleting an entry is irreversible and there is no undo, so the first press
 * only reveals the confirmation. The destructive control is never the one
 * under the cursor by default.
 *
 * The confirmation is inline rather than a window.confirm: a native dialog
 * cannot be styled, reads poorly to screen readers, and is blocked in some
 * embedded browsers. role="alertdialog" plus autofocus on Cancel means the
 * safe option is the one that has focus.
 */
export function DeleteEntryButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const remove = deleteEntryAction.bind(null, id);

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-label="Confirm delete"
      className="border-line bg-surface-raised flex flex-wrap items-center gap-3 rounded-md border p-3"
    >
      <p className="text-ink text-sm">Delete this entry permanently?</p>

      <form action={remove} className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          autoFocus
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
        <SubmitButton
          size="sm"
          pendingLabel="Deleting…"
          className="border-status-error bg-status-error text-surface-raised hover:opacity-90"
        >
          Delete
        </SubmitButton>
      </form>
    </div>
  );
}
