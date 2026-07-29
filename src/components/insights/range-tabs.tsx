"use client";

import { useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RANGES, type Range } from "@/lib/insights-range";

const LABELS: Record<Range, string> = {
  week: "Week",
  month: "Month",
  year: "Year",
};

const PANEL_ID = "insights-panel";
const tabId = (range: Range) => `insights-tab-${range}`;

type RangeTabsProps = {
  current: Range;
  /** The panel's content, rendered on the server and streamed in. */
  children: ReactNode;
};

/**
 * Range selector built as a tablist with roving tabindex, plus the panel it
 * controls. They ship together because the ARIA relationship is mutual: the
 * tabs need the panel's id and the panel needs the selected tab's.
 *
 * Only the selected tab is tabbable; arrow keys move between them, Home and End
 * jump to the ends. That is the WAI-ARIA tabs pattern, and it makes the group
 * one tab stop rather than three, for the same reason the mood scale uses
 * native radios.
 *
 * Selecting pushes the range into the URL rather than holding it in state, so a
 * range is shareable and the back button walks the history. `scroll: false`
 * keeps the page from jumping to the top on every change.
 */
export function RangeTabs({ current, children }: RangeTabsProps) {
  const router = useRouter();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isPending, startTransition] = useTransition();

  function select(range: Range) {
    if (range === current) return;
    // Inside a transition so the old panel stays on screen and dims while the
    // new range loads, rather than being replaced by a skeleton it does not
    // need. isPending is what drives the crossfade below.
    startTransition(() => {
      router.push(`/dashboard/insights?range=${range}`, { scroll: false });
    });
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const last = RANGES.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;

    event.preventDefault();
    // Focus moves first so the control feels immediate; the navigation that
    // follows is what actually changes the data.
    refs.current[next]?.focus();
    select(RANGES[next]);
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Time range"
        className="border-line bg-surface-raised inline-flex gap-1 rounded-full border p-1"
      >
        {RANGES.map((range, index) => {
          const selected = range === current;
          return (
            <button
              key={range}
              ref={(node) => {
                refs.current[index] = node;
              }}
              id={tabId(range)}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={PANEL_ID}
              // The roving part: unselected tabs leave the tab order.
              tabIndex={selected ? 0 : -1}
              onClick={() => select(range)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={[
                "ease-standard rounded-full px-4 py-1.5 text-sm transition-colors duration-150",
                selected
                  ? "bg-surface-sunken text-ink font-medium"
                  : "text-muted hover:text-ink",
              ].join(" ")}
            >
              {LABELS[range]}
            </button>
          );
        })}
      </div>

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={tabId(current)}
        aria-busy={isPending}
        className={`ease-standard transition-opacity duration-200 ${
          isPending ? "opacity-40" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </>
  );
}
