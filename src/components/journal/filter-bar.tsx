import Link from "next/link";
import type { Tag } from "@/lib/data/tags";
import { MOOD_OPTIONS } from "@/lib/moods";
import {
  buildJournalHref,
  type JournalSearchParams,
} from "@/lib/validation/journal";

/**
 * Filters as links, not a JavaScript-driven control.
 *
 * Each option is a URL, so the server renders the filtered result directly, the
 * back button walks the filter history, and a filtered view can be shared. It
 * also works with JavaScript off, which a client-side filter would not.
 *
 * A row rather than a block: it sits above a page people scroll, and a tall
 * panel of controls would push the writing off the screen every time. The date
 * range moved to its own disclosure for the same reason — it is the least used
 * filter and the only one needing two decisions at once.
 */

const mood = [
  "ease-standard duration-hover grid size-9 place-items-center rounded-full border text-lg",
  "border-line bg-surface-raised transition-[transform,box-shadow,border-color]",
  "hover:border-line-strong hover:-translate-y-0.5 hover:shadow-md",
].join(" ");

const moodActive = [
  "ease-standard duration-hover grid size-9 place-items-center rounded-full border text-lg",
  "border-accent-pressed bg-accent -translate-y-0.5 shadow-md transition-[transform,box-shadow,border-color]",
].join(" ");

const chip = [
  "ease-standard duration-hover inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs transition-colors",
  "border-line bg-surface-raised text-muted hover:border-line-strong hover:text-ink",
].join(" ");

const chipActive = [
  "ease-standard duration-hover inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
  "border-line-strong bg-surface-sunken text-ink before:mr-1.5 before:content-['✓']",
].join(" ");

export function FilterBar({
  tags,
  current,
  total,
}: {
  tags: Tag[];
  current: JournalSearchParams;
  /** How many entries this filter set matches, so the row says what it did. */
  total: number;
}) {
  const hasFilters = Boolean(
    current.tag || current.mood || current.from || current.to,
  );

  return (
    <section
      aria-label="Filters"
      className="from-surface via-surface sticky top-0 z-20 flex flex-wrap items-center gap-2 bg-gradient-to-b via-75% to-transparent py-3"
    >
      <ul className="flex gap-1.5">
        {MOOD_OPTIONS.map((option) => {
          const active = current.mood === option.value;
          return (
            <li key={option.value}>
              <Link
                href={buildJournalHref(current, {
                  mood: active ? undefined : String(option.value),
                })}
                aria-current={active ? "true" : undefined}
                title={option.label}
                className={active ? moodActive : mood}
              >
                <span aria-hidden="true">{option.emoji}</span>
                <span className="sr-only">
                  {active ? `Clear ${option.label}` : option.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = current.tag === tag.id;
            return (
              <li key={tag.id}>
                <Link
                  href={buildJournalHref(current, {
                    tag: active ? undefined : tag.id,
                  })}
                  aria-current={active ? "true" : undefined}
                  className={active ? chipActive : chip}
                >
                  {tag.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/*
       * A native disclosure, so the least-used filter costs no height until
       * asked for and still works with JavaScript off. GET, so submitting
       * writes the range into the URL exactly as the links above do.
       */}
      <details className="group relative">
        <summary
          className={`${chip} cursor-pointer list-none marker:content-none`}
        >
          {current.from || current.to ? "Dates ✓" : "Dates"}
        </summary>

        <form
          method="GET"
          action="/dashboard/journal"
          className="border-line bg-surface-raised absolute top-full left-0 z-30 mt-2 flex w-64 flex-col gap-3 rounded-lg border p-4 shadow-md"
        >
          {current.tag && (
            <input type="hidden" name="tag" value={current.tag} />
          )}
          {current.mood !== undefined && (
            <input type="hidden" name="mood" value={current.mood} />
          )}

          <label className="text-muted text-xs">
            From
            <input
              type="date"
              name="from"
              defaultValue={current.from ?? ""}
              className="border-line bg-surface-raised text-ink mt-1 w-full rounded-sm border px-2.5 py-1.5 font-mono text-xs"
            />
          </label>

          <label className="text-muted text-xs">
            To
            <input
              type="date"
              name="to"
              defaultValue={current.to ?? ""}
              className="border-line bg-surface-raised text-ink mt-1 w-full rounded-sm border px-2.5 py-1.5 font-mono text-xs"
            />
          </label>

          <button
            type="submit"
            className="border-field bg-surface-raised text-ink hover:bg-surface-sunken ease-standard duration-hover rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Apply
          </button>
        </form>
      </details>

      <span className="flex-1" />

      {hasFilters && (
        <Link
          href="/dashboard/journal"
          className="text-muted hover:text-ink text-xs underline underline-offset-2"
        >
          Clear
        </Link>
      )}

      <span className="text-subtle font-mono text-xs tabular-nums">
        {total} {total === 1 ? "entry" : "entries"}
      </span>
    </section>
  );
}
