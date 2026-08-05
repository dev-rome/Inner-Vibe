"use client";

import { useState } from "react";
import type { Entry } from "@/lib/data/entries";
import { groupByMonth } from "@/lib/journal-grouping";
import { JournalEntryRow } from "./journal-entry-row";

/**
 * The journal as a run of months.
 *
 * One entry open at a time. Letting several stay open turns the page into a
 * wall of text and loses the thing you were reading; closing the last one
 * keeps it calm and means the answer to "where was I" is always on screen.
 *
 * Which one is open lives here rather than in the URL: it is a reading
 * position, not a place. Putting it in the address bar would fill the back
 * button with every entry anyone glanced at.
 */
export function JournalTimeline({
  entries,
  timeZone,
}: {
  entries: Entry[];
  timeZone: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const groups = groupByMonth(entries, timeZone);

  // Continues across month headings, so the stagger reads as one page
  // arriving rather than each month restarting.
  let position = 0;

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`month-${group.key}`}>
          {/*
           * Sticks under the filter bar. The gradient stops the entries
           * scrolling into the text rather than under a hard band.
           */}
          <h2
            id={`month-${group.key}`}
            className="from-surface via-surface sticky top-16 z-10 flex items-baseline gap-3 bg-gradient-to-b via-70% to-transparent py-1.5"
          >
            <span className="font-display text-ink text-[0.95rem] font-semibold tracking-tight">
              {group.label}
            </span>
            <span className="text-subtle font-mono text-xs">
              {group.entries.length}{" "}
              {group.entries.length === 1 ? "entry" : "entries"}
            </span>
            <span
              aria-hidden="true"
              className="from-line h-px flex-1 bg-gradient-to-r to-transparent"
            />
          </h2>

          <ul className="mt-3 flex flex-col gap-2.5">
            {group.entries.map((entry) => (
              <JournalEntryRow
                key={entry.id}
                entry={entry}
                timeZone={timeZone}
                index={position++}
                open={openId === entry.id}
                onToggle={() =>
                  setOpenId((current) =>
                    current === entry.id ? null : entry.id,
                  )
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
