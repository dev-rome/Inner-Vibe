import { EntryListSkeleton } from "@/components/entries/entry-skeleton";

// Covers a full page load. Navigating between filters is handled by the
// Suspense boundaries inside the page, which swap independently.
export default function JournalLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <div className="bg-surface-sunken h-8 w-32 animate-pulse rounded-sm" />
      <div className="bg-surface-sunken mt-8 h-40 animate-pulse rounded-lg" />
      <div className="mt-8">
        <EntryListSkeleton />
      </div>
    </div>
  );
}
