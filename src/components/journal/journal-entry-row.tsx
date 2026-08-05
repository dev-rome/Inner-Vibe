"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { Entry } from "@/lib/data/entries";
import { moodForRating } from "@/lib/moods";
import { moodTint } from "@/lib/journal-grouping";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { buttonClasses } from "@/components/ui/button";
import { DeleteEntryButton } from "@/components/entries/delete-entry-button";

/**
 * One entry, closed to a line and opened to the whole thing.
 *
 * Opening in place rather than navigating is the point: re-reading a run of
 * entries is the main thing anyone does here, and a detail page per entry
 * means losing your place eight times to read eight days.
 *
 * The mood's colour runs down the edge and behind the face at a strength set by
 * the rating. One hue, never a scale from good to bad — a hard day reads softer
 * here, not redder, which is the same rule the calendar follows.
 */

const EASE_OUT = [0.33, 1, 0.68, 1] as const;

type JournalEntryRowProps = {
  entry: Entry;
  timeZone: string;
  open: boolean;
  onToggle: () => void;
  /** Position in its month, for the entrance stagger. */
  index: number;
};

export function JournalEntryRow({
  entry,
  timeZone,
  open,
  onToggle,
  index,
}: JournalEntryRowProps) {
  const reduced = useReducedMotion();
  const mood = moodForRating(entry.rating);
  const label = mood?.label ?? "Logged";
  const tint = moodTint(entry.rating);

  const when = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(entry.loggedAt);

  const panelId = `entry-panel-${entry.id}`;

  return (
    <li
      /*
       * The stagger runs from a visible resting state, so if the animation
       * never plays the entry is simply there. Starting at opacity 0 and
       * relying on something to reveal it risks a blank page.
       */
      className="reveal-rise border-line bg-surface-raised hover:border-line-strong ease-standard duration-hover relative overflow-hidden rounded-xl border shadow-sm transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${90 + index * 70}ms` }}
    >
      {/* Single hue, strength only. color-mix keeps it tied to the one token. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{
          backgroundColor: `color-mix(in srgb, var(--color-accent) ${tint}%, var(--color-line))`,
        }}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 py-4 pr-5 pl-6 text-left"
      >
        <motion.span
          aria-hidden="true"
          className="grid size-13 shrink-0 place-items-center rounded-full text-2xl"
          style={{
            backgroundColor: `color-mix(in srgb, var(--color-accent) ${Math.round(tint * 0.34)}%, var(--color-surface-sunken))`,
          }}
          // Overshoot, the one place in the app a little bounce belongs: it is
          // the face reacting to being opened.
          animate={reduced ? {} : { scale: open ? 1.12 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          {mood?.emoji}
        </motion.span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-display text-ink font-semibold">{label}</span>
            <span className="text-subtle font-mono text-xs">{when}</span>
          </span>

          {/* Hidden once open, or the first line would be said twice. */}
          {!open && entry.note && (
            <span className="text-muted mt-0.5 block truncate text-sm">
              {entry.note}
            </span>
          )}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`text-icon ease-standard duration-state size-4.5 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/*
       * Motion measures the content and animates a real pixel height, which is
       * why this is not the CSS grid 0fr/1fr trick: that needs the engine to
       * interpolate flex track sizes, and where it will not, a declared
       * transition pins the panel shut instead of snapping it open.
       */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.46, ease: EASE_OUT }
            }
            className="overflow-hidden"
          >
            <div className="pt-1 pr-5 pb-5 pl-24">
              {entry.note ? (
                <Unfurl delayMs={80} reduced={reduced}>
                  <p className="text-ink text-[1.0625rem] leading-[1.7] whitespace-pre-wrap">
                    {entry.note}
                  </p>
                </Unfurl>
              ) : (
                <Unfurl delayMs={80} reduced={reduced}>
                  <p className="text-subtle text-[1.0625rem] italic">
                    No note on this one.
                  </p>
                </Unfurl>
              )}

              <Unfurl delayMs={160} reduced={reduced}>
                <Facts entry={entry} />
              </Unfurl>

              <Unfurl delayMs={240} reduced={reduced}>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/dashboard/journal/${entry.id}`}
                    className={buttonClasses("secondary", "sm")}
                  >
                    Open
                  </Link>
                  <Link
                    href={`/dashboard/journal/${entry.id}/edit`}
                    className={buttonClasses("secondary", "sm")}
                  >
                    Edit
                  </Link>
                  <DeleteEntryButton id={entry.id} />
                </div>
              </Unfurl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Each part arrives just behind the panel opening, rather than all at once. */
function Unfurl({
  delayMs,
  reduced,
  children,
}: {
  delayMs: number;
  reduced: boolean;
  children: React.ReactNode;
}) {
  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.44, ease: EASE_OUT, delay: delayMs / 1000 }}
    >
      {children}
    </motion.div>
  );
}

function Facts({ entry }: { entry: Entry }) {
  const facts: string[] = [];

  if (entry.sleepHours !== null) facts.push(`${entry.sleepHours}h sleep`);
  if (entry.exercised === true) facts.push("Exercised");
  if (entry.exercised === false) facts.push("No exercise");

  if (facts.length === 0 && entry.tags.length === 0) return null;

  return (
    <div className="text-subtle mt-3.5 flex flex-wrap items-center gap-2 text-xs">
      {entry.tags.map((tag) => (
        <span
          key={tag.id}
          className="border-line bg-surface text-muted rounded-full border px-2.5 py-1"
        >
          {tag.name}
        </span>
      ))}
      {facts.length > 0 && <span>{facts.join(" · ")}</span>}
    </div>
  );
}
