import Link from "next/link";
import type { Tag } from "@/lib/data/tags";
import { MOOD_OPTIONS } from "@/lib/moods";
import {
  buildJournalHref,
  type JournalSearchParams,
} from "@/lib/validation/journal";
import { Input } from "@/components/ui/input";
import { buttonClasses } from "@/components/ui/button";

type EntryFiltersProps = {
  tags: Tag[];
  current: JournalSearchParams;
};

const chip = [
  "ease-standard inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition-colors duration-hover",
  "border-line bg-surface-raised text-ink hover:border-line-strong",
].join(" ");

const chipActive = [
  "ease-standard inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-hover",
  "border-line-strong bg-surface-sunken text-ink before:mr-1 before:content-['✓']",
].join(" ");

/**
 * Filters as links, not a JavaScript-driven control.
 *
 * Each option is a URL, so the server renders the filtered result directly,
 * the back button walks the filter history, and a filtered view can be
 * shared. It also works with JavaScript off, which a client-side filter
 * would not.
 *
 * The date range is a real form because two dates are one decision; making
 * each a link would mean navigating twice to express one range.
 */
export function EntryFilters({ tags, current }: EntryFiltersProps) {
  const hasFilters = Boolean(
    current.tag || current.mood || current.from || current.to,
  );

  return (
    <section aria-labelledby="filters-heading" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="filters-heading" className="text-ink text-base font-medium">
          Filter
        </h2>
        {hasFilters && (
          <Link
            href="/dashboard/journal"
            className="text-muted hover:text-ink text-sm underline underline-offset-2"
          >
            Clear all
          </Link>
        )}
      </div>

      <div>
        <h3 className="text-muted text-sm">Mood</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((option) => {
            const active = current.mood === option.value;
            return (
              <li key={option.value}>
                <Link
                  href={buildJournalHref(current, {
                    mood: active ? undefined : String(option.value),
                  })}
                  aria-current={active ? "true" : undefined}
                  className={active ? chipActive : chip}
                >
                  <span aria-hidden="true" className="mr-1">
                    {option.emoji}
                  </span>
                  {option.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {tags.length > 0 && (
        <div>
          <h3 className="text-muted text-sm">Tag</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
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
        </div>
      )}

      {/* GET, so submitting writes the range into the URL like the links do. */}
      <form
        method="GET"
        action="/dashboard/journal"
        className="flex flex-wrap items-end gap-3"
      >
        {current.tag && <input type="hidden" name="tag" value={current.tag} />}
        {current.mood !== undefined && (
          <input type="hidden" name="mood" value={current.mood} />
        )}

        <div>
          <label htmlFor="from" className="text-muted block text-sm">
            From
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={current.from ?? ""}
            className="mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="to" className="text-muted block text-sm">
            To
          </label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={current.to ?? ""}
            className="mt-1.5"
          />
        </div>

        <button type="submit" className={buttonClasses("secondary", "sm")}>
          Apply dates
        </button>
      </form>
    </section>
  );
}
