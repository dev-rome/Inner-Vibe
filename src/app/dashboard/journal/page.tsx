import { Suspense } from "react";
import Link from "next/link";
import { getTags } from "@/lib/data/tags";
import { getTimeZone } from "@/lib/data/profile";
import {
  countJournalEntries,
  decodeCursor,
  encodeCursor,
  getJournalPage,
} from "@/lib/data/journal";
import { parseJournalParams } from "@/lib/validation/journal";
import { FilterBar } from "@/components/journal/filter-bar";
import { JournalTimeline } from "@/components/journal/journal-timeline";
import { TimelineSkeleton } from "@/components/journal/timeline-skeleton";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";

type Filters = ReturnType<typeof parseJournalParams>;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JournalPage({ searchParams }: PageProps) {
  const filters = parseJournalParams(await searchParams);

  return (
    /*
     * One column, and a narrow one. This is a page of writing: past about 70
     * characters a line the eye starts losing its place between them, and the
     * whole point of the page is that people actually read it.
     */
    <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        title="Your journal"
        description="Everything you have written. Open one to read it again."
      />

      <Suspense fallback={<BarFallback />}>
        <Bar filters={filters} />
      </Suspense>

      {/*
       * Keyed on the filters so changing them swaps in a fresh fallback rather
       * than leaving the previous results on screen while the new query runs.
       * The cursor is deliberately part of the key: a new page of entries
       * should replay its entrance rather than appear mid-stagger.
       */}
      <Suspense key={JSON.stringify(filters)} fallback={<TimelineSkeleton />}>
        <Timeline filters={filters} />
      </Suspense>
    </div>
  );
}

async function Bar({ filters }: { filters: Filters }) {
  const timeZone = await getTimeZone();

  const [tags, total] = await Promise.all([
    getTags(),
    countJournalEntries(
      {
        tagId: filters.tag,
        mood: filters.mood,
        from: filters.from,
        to: filters.to,
      },
      timeZone,
    ),
  ]);

  return <FilterBar tags={tags} current={filters} total={total} />;
}

function BarFallback() {
  return (
    <div className="flex gap-1.5 py-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="skeleton size-9 rounded-full" />
      ))}
    </div>
  );
}

async function Timeline({ filters }: { filters: Filters }) {
  const timeZone = await getTimeZone();
  const cursor = filters.cursor ? decodeCursor(filters.cursor) : null;

  const { entries, nextCursor } = await getJournalPage(
    {
      tagId: filters.tag,
      mood: filters.mood,
      from: filters.from,
      to: filters.to,
    },
    cursor,
    timeZone,
  );

  const hasFilters = Boolean(
    filters.tag || filters.mood || filters.from || filters.to,
  );

  if (entries.length === 0) {
    return (
      <EmptyState className="mt-4">
        {hasFilters ? (
          <>
            <p className="text-ink">Nothing matches those filters.</p>
            <p className="text-muted mt-1 text-sm">
              Try widening the range, or clear them to see everything.
            </p>
          </>
        ) : (
          <>
            <p className="text-ink">Nothing written yet.</p>
            <p className="text-muted mt-1 text-sm">
              Log how you are feeling and it will show up here.
            </p>
          </>
        )}
      </EmptyState>
    );
  }

  return (
    <>
      <div className="mt-2">
        <JournalTimeline entries={entries} timeZone={timeZone} />
      </div>

      {nextCursor && (
        <nav className="mt-8 flex justify-center" aria-label="Pagination">
          <Link
            href={olderHref(filters, encodeCursor(nextCursor))}
            className={buttonClasses("secondary")}
          >
            Show earlier entries
          </Link>
        </nav>
      )}
    </>
  );
}

/** Keeps every filter and swaps only the cursor. */
function olderHref(filters: Filters, cursor: string): string {
  const params = new URLSearchParams();

  if (filters.tag) params.set("tag", filters.tag);
  if (filters.mood !== undefined) params.set("mood", String(filters.mood));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("cursor", cursor);

  return `/dashboard/journal?${params}`;
}
