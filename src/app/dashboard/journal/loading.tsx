import { TimelineSkeleton } from "@/components/journal/timeline-skeleton";

/*
 * Covers a full page load. Changing filters is handled by the Suspense
 * boundaries inside the page, which swap independently.
 *
 * The width, padding and the shape of the filter row all mirror the page
 * exactly. At the old narrower measure this opened one size and jumped to
 * another the moment the real page arrived, which is worse than showing
 * nothing at all.
 */
export default function JournalLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pt-8 pb-20 sm:px-6 lg:px-8">
      <div className="skeleton h-9 w-48 rounded-md" aria-hidden="true" />
      <div
        className="skeleton mt-2 h-4 w-80 max-w-full rounded-md"
        aria-hidden="true"
      />

      <div className="flex gap-1.5 py-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton size-9 rounded-full" />
        ))}
      </div>

      <TimelineSkeleton />
    </div>
  );
}
