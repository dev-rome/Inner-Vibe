import type { ReactNode } from "react";
import type { Entry } from "@/lib/data/entries";
import { EmptyState } from "@/components/ui/card";
import { EntryCard } from "./entry-card";

type EntryListProps = {
  entries: Entry[];
  timeZone: string;
  /** Cards link to their detail view when true. */
  linkToDetail?: boolean;
  /** Shown instead of the default copy when a filter returned nothing. */
  empty?: ReactNode;
};

export function EntryList({
  entries,
  timeZone,
  linkToDetail = false,
  empty,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState>
        {empty ?? (
          <>
            <p className="text-ink">No entries yet.</p>
            <p className="text-muted mt-1 text-sm">
              Log how you are feeling above. One entry is enough to start.
            </p>
          </>
        )}
      </EmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <EntryCard
          key={entry.id}
          entry={entry}
          timeZone={timeZone}
          href={linkToDetail ? `/dashboard/journal/${entry.id}` : undefined}
        />
      ))}
    </ul>
  );
}
