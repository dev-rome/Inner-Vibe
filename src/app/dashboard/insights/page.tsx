import { Suspense } from "react";
import Link from "next/link";
import { getTimeZone } from "@/lib/data/profile";
import {
  getInsightsSummary,
  getMoodByDay,
  getMoodByExercise,
  getMoodBySleep,
  getMoodOverTime,
} from "@/lib/data/insights";
import {
  DEFAULT_RANGE,
  datesInWindow,
  isRange,
  resolveRange,
  type Range,
  type RangeWindow,
} from "@/lib/insights-range";
import { InsightsGreeting } from "@/components/insights/insights-greeting";
import { RangeTabs } from "@/components/insights/range-tabs";
import { MoodTrend } from "@/components/insights/mood-trend";
import { FactorCards } from "@/components/insights/factor-cards";
import { MoodCalendar } from "@/components/insights/mood-calendar";
import {
  CalendarSkeleton,
  FactorCardsSkeleton,
  TrendSkeleton,
} from "@/components/insights/insights-skeletons";
import { Card, EmptyState } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";

/**
 * The page assembles rather than appears: greeting, then trend, then the
 * factor cards, then the calendar, over about a second and a half. The delays
 * are fixed rather than tied to when each query lands, so the order is the same
 * every visit whatever the network did. The reduced-motion rule zeroes all of
 * them, and then everything is simply there.
 */
const REVEAL = {
  trend: 150,
  factors: 320,
  calendar: 520,
} as const;

/**
 * The calendar reads as a month grid at most. A year of tiles is a wall, and
 * the year range already tells its story in the weekly trend above.
 */
const CALENDAR_MAX_DAYS = 35;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InsightsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = isRange(params.range) ? params.range : DEFAULT_RANGE;

  const timeZone = await getTimeZone();
  const summary = await getInsightsSummary(timeZone);
  const rangeWindow = resolveRange(range, timeZone);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <nav className="flex justify-end">
        <Link
          href="/dashboard"
          className="text-muted hover:text-ink text-sm underline underline-offset-2"
        >
          Back to log
        </Link>
      </nav>

      <div className="mt-6">
        <InsightsGreeting summary={summary} />
      </div>

      {/*
       * Nothing logged yet means there is nothing to range over, so the page
       * stops at the invitation rather than laying out four empty frames.
       */}
      {summary.totalEntries === 0 ? (
        <EmptyState className="reveal-rise mt-8">
          <p className="text-ink">Log how you feel and this fills in.</p>
          <Link href="/dashboard" className={`${buttonClasses()} mt-4`}>
            Log an entry
          </Link>
        </EmptyState>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          <RangeTabs current={range}>
            <div className="flex flex-col gap-8">
              <Suspense fallback={<TrendSkeleton />}>
                <TrendSection
                  range={range}
                  rangeWindow={rangeWindow}
                  timeZone={timeZone}
                />
              </Suspense>

              <Suspense fallback={<FactorCardsSkeleton />}>
                <FactorsSection rangeWindow={rangeWindow} />
              </Suspense>

              <Suspense fallback={<CalendarSkeleton />}>
                <CalendarSection
                  rangeWindow={rangeWindow}
                  timeZone={timeZone}
                />
              </Suspense>
            </div>
          </RangeTabs>
        </div>
      )}
    </main>
  );
}

type SectionProps = { rangeWindow: RangeWindow; timeZone: string };

async function TrendSection({
  range,
  rangeWindow,
  timeZone,
}: SectionProps & { range: Range }) {
  const points = await getMoodOverTime(range, rangeWindow, timeZone);

  return (
    <Card
      as="section"
      className="reveal-rise"
      style={{ animationDelay: `${REVEAL.trend}ms` }}
      aria-labelledby="trend-heading"
    >
      <h2 id="trend-heading" className="text-ink text-base font-medium">
        How you have been
      </h2>
      <p className="text-subtle mt-1 text-xs">
        {range === "year" ? "Weekly average" : "Daily average"} over the last{" "}
        {rangeWindow.days} days.
      </p>
      <div className="mt-4">
        <MoodTrend points={points} range={range} />
      </div>
    </Card>
  );
}

async function FactorsSection({ rangeWindow }: { rangeWindow: RangeWindow }) {
  // Independent aggregates, so they go out together rather than in sequence.
  const [exercise, sleep] = await Promise.all([
    getMoodByExercise(rangeWindow),
    getMoodBySleep(rangeWindow),
  ]);

  return (
    <section aria-label="What went with it">
      <FactorCards
        exercise={exercise}
        sleep={sleep}
        baseDelayMs={REVEAL.factors}
      />
    </section>
  );
}

async function CalendarSection({ rangeWindow, timeZone }: SectionProps) {
  const days = await getMoodByDay(rangeWindow, timeZone);
  const dates = datesInWindow(rangeWindow, timeZone).slice(-CALENDAR_MAX_DAYS);

  return (
    <Card as="section" aria-labelledby="calendar-heading">
      <h2 id="calendar-heading" className="text-ink text-base font-medium">
        Day by day
      </h2>
      <p className="text-subtle mt-1 text-xs">
        Stronger colour is a higher average. Choose a day to open it.
      </p>
      <div className="mt-4">
        <MoodCalendar days={days} dates={dates} baseDelayMs={REVEAL.calendar} />
      </div>
    </Card>
  );
}
