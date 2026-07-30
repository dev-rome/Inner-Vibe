"use client";

import { useRef, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { RANGES, type Range } from "@/lib/insights-range";
import { useReducedMotion } from "@/lib/use-reduced-motion";

const LABELS: Record<Range, string> = {
  week: "Week",
  month: "Month",
  year: "Year",
};

const PANEL_ID = "insights-panel";
const tabId = (range: Range) => `insights-tab-${range}`;

type RangeTabsProps = {
  current: Range;
  /** Sits on the same row as the tabs, so the band reads as one heading. */
  heading?: ReactNode;
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
export function RangeTabs({ current, heading, children }: RangeTabsProps) {
  const router = useRouter();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isPending, startTransition] = useTransition();
  const reduced = useReducedMotion();

  function select(range: Range) {
    if (range === current) return;
    // Inside a transition so the old panel stays on screen and dims while the
    // new range loads, rather than being replaced by a skeleton it does not
    // need. isPending is what drives the crossfade below.
    startTransition(() => {
      router.push(`/dashboard?range=${range}`, { scroll: false });
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
    /*
     * One element, not a fragment.
     *
     * A fragment flattens into whatever flex or grid contains it, so the tabs
     * and their panel became separate children of the page's between-bands gap
     * and drifted 40px apart. Owning the spacing between the two halves of this
     * control is this component's job, not its caller's.
     */
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {heading}

        <div
          role="tablist"
          aria-label="Time range"
          className="bg-surface-sunken inline-flex gap-1 rounded-full p-1"
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
                className="ease-standard relative rounded-full px-4 py-1.5 text-sm transition-colors duration-150"
              >
                {/*
                 * The pill slides between tabs rather than cutting, because
                 * layoutId lets Motion interpolate between two different
                 * elements' boxes. Behind the label, so the text stays put.
                 */}
                {selected && (
                  <motion.span
                    layoutId="range-pill"
                    aria-hidden="true"
                    className="bg-surface-raised absolute inset-0 rounded-full shadow-sm"
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 32 }
                    }
                  />
                )}
                <span
                  className={`relative ${
                    selected ? "text-ink font-medium" : "text-muted"
                  }`}
                >
                  {LABELS[range]}
                </span>
              </button>
            );
          })}
        </div>
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
    </section>
  );
}
