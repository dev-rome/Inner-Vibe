import {
  CalendarSkeleton,
  FactorCardsSkeleton,
  GreetingSkeleton,
  TrendSkeleton,
} from "@/components/insights/insights-skeletons";

// Covers the first paint, while the greeting's summary resolves. Changing
// range afterwards never reaches here: that runs as a transition, so the
// previous range stays on screen and dims instead.
export default function InsightsLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="mt-6">
        <GreetingSkeleton />
      </div>
      <div className="mt-8 flex flex-col gap-8">
        <div
          className="bg-surface-sunken h-10 w-56 animate-pulse rounded-full"
          aria-hidden="true"
        />
        <TrendSkeleton />
        <FactorCardsSkeleton />
        <CalendarSkeleton />
      </div>
    </main>
  );
}
