import { Suspense } from "react";
import Link from "next/link";
import { getTags } from "@/lib/data/tags";
import { getTimeZone } from "@/lib/data/profile";
import { decodeCursor, encodeCursor, getJournalPage } from "@/lib/data/journal";
import { parseJournalParams } from "@/lib/validation/journal";
import { EntryFilters } from "@/components/entries/entry-filters";
import { EntryList } from "@/components/entries/entry-list";
import { EntryListSkeleton } from "@/components/entries/entry-skeleton";
import { buttonClasses } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JournalPage({ searchParams }: PageProps) {
  const filters = parseJournalParams(await searchParams);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl">Journal</h1>
        <Link
          href="/dashboard"
          className="text-muted hover:text-ink text-sm underline underline-offset-2"
        >
          Back to log
        </Link>
      </header>

      <div className="mt-8">
        <Suspense fallback={<FiltersFallback />}>
          <Filters filters={filters} />
        </Suspense>
      </div>

      {/*
       * Keyed on the filters so changing them swaps in a fresh fallback rather
       * than leaving the previous page's entries on screen while the new query
       * runs. Without the key React reuses the boundary and shows stale rows.
       */}
      <div className="mt-8">
        <Suspense
          key={JSON.stringify(filters)}
          fallback={<EntryListSkeleton />}
        >
          <Results filters={filters} />
        </Suspense>
      </div>
    </main>
  );
}

async function Filters({
  filters,
}: {
  filters: ReturnType<typeof parseJournalParams>;
}) {
  const tags = await getTags();
  return <EntryFilters tags={tags} current={filters} />;
}

function FiltersFallback() {
  return <div className="bg-surface-sunken h-40 animate-pulse rounded-lg" />;
}

async function Results({
  filters,
}: {
  filters: ReturnType<typeof parseJournalParams>;
}) {
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

  return (
    <>
      <EntryList
        entries={entries}
        timeZone={timeZone}
        linkToDetail
        empty={
          hasFilters ? (
            <>
              <p className="text-ink">Nothing matches those filters.</p>
              <p className="text-muted mt-1 text-sm">
                Try widening the range, or clear them to see everything.
              </p>
            </>
          ) : undefined
        }
      />

      {nextCursor && (
        <nav className="mt-6 flex justify-center" aria-label="Pagination">
          <Link
            href={nextPageHref(filters, encodeCursor(nextCursor))}
            className={buttonClasses("secondary")}
          >
            Older entries
          </Link>
        </nav>
      )}
    </>
  );
}

function nextPageHref(
  filters: ReturnType<typeof parseJournalParams>,
  cursor: string,
): string {
  const params = new URLSearchParams();
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.mood !== undefined) params.set("mood", String(filters.mood));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("cursor", cursor);

  return `/dashboard/journal?${params}`;
}
