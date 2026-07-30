import Link from "next/link";
import { Suspense } from "react";
import { getEntries } from "@/lib/data/entries";
import { getTags } from "@/lib/data/tags";
import { getProfile } from "@/lib/data/profile";
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
} from "@/lib/insights-range";
import { contextLine, deriveInsight } from "@/lib/insights-copy";
import { GreetingTitle } from "@/components/dashboard/greeting-title";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { EntryForm } from "@/components/entries/entry-form";
import { EntryList } from "@/components/entries/entry-list";
import { EntryListSkeleton } from "@/components/entries/entry-skeleton";
import { RangeTabs } from "@/components/insights/range-tabs";
import { MoodTrend } from "@/components/insights/mood-trend";
import { FactorCards } from "@/components/insights/factor-cards";
import { MoodCalendar } from "@/components/insights/mood-calendar";
import {
  CalendarSkeleton,
  CheckInSkeleton,
  FactorCardsSkeleton,
  InsightSkeleton,
  TrendSkeleton,
} from "@/components/dashboard/skeletons";
import { HeaderPill, PageHeader } from "@/components/shell/page-header";

const RECENT_COUNT = 3;

/** The calendar reads as a month grid at most, never a wall of tiles. */
const CALENDAR_MAX_DAYS = 35;

/*
 * Vertical rhythm.
 *
 * Cards inside a band sit closer together than bands do to each other, which is
 * what makes four bands read as four things rather than as six loose cards. One
 * gap value each, so the ratio stays deliberate instead of accumulating.
 */
const WITHIN_BAND = "gap-4";
const BETWEEN_BANDS = "gap-8";

/*
 * The order the page acknowledges a new entry in, top to bottom.
 *
 * Roughly 160ms apart, which is slow enough to follow with your eye and read as
 * a sequence. Tighter than this and four sections arriving at once just looks
 * like a stutter. The last one starts as the ring around your chosen face is
 * finishing, so the page picks up where the check-in left off.
 *
 * The reduced-motion rule zeroes every delay, collapsing the whole cascade to
 * everything simply being there.
 */
const CASCADE = {
  trend: 120,
  factors: 280,
  calendar: 440,
  lately: 600,
} as const;

/** Wraps a section so it re-announces itself when it remounts after a save. */
function Settle({
  delayMs,
  children,
}: {
  delayMs: number;
  children: React.ReactNode;
}) {
  return (
    <div className="reveal-rise" style={{ animationDelay: `${delayMs}ms` }}>
      {children}
    </div>
  );
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Dashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = isRange(params.range) ? params.range : DEFAULT_RANGE;

  const { timeZone, displayName } = await getProfile();
  const summary = await getInsightsSummary(timeZone);

  // Formatted in the profile's zone for the same reason the greeting is: the
  // server's idea of today is UTC, which is yesterday for a good part of it.
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  /*
   * The cascade after a save, without a line of client state.
   *
   * These sections already carry entrance animations with staggered delays;
   * they simply never replay, because a Server Action refresh reconciles the
   * tree rather than remounting it. Keying them on the entry count means a new
   * entry — and only a new entry — rebuilds them, so the chart draws itself
   * again, the calendar waves back in and the list settles, one after another.
   *
   * Changing the range does not touch this key, so switching Week to Month
   * still crossfades rather than re-announcing the whole page.
   */
  const savedKey = summary.totalEntries;

  return (
    <div
      className={`mx-auto flex w-full max-w-6xl flex-col px-5 py-8 sm:px-6 lg:px-10 ${BETWEEN_BANDS}`}
    >
      {/* Band 1 */}
      <PageHeader
        title={<GreetingTitle displayName={displayName} timeZone={timeZone} />}
        description={contextLine(summary)}
        actions={<HeaderPill>{today}</HeaderPill>}
      />

      {/* Band 2: the check-in leads, the observation sits beside it. */}
      <div
        className={`grid grid-cols-1 items-start lg:grid-cols-3 ${WITHIN_BAND}`}
      >
        <DashboardCard
          id="check-in"
          eyebrow="Check in"
          title="How are you, right now?"
          tone="hero"
          className="lg:col-span-2"
        >
          {/* The tags query is the only thing this waits on, but it is the
              hero card: an empty box where the scale should be is the first
              thing anyone sees. */}
          <Suspense fallback={<CheckInSkeleton />}>
            <CheckIn />
          </Suspense>
        </DashboardCard>

        <Suspense fallback={<InsightSkeleton />}>
          <Insight range={range} timeZone={timeZone} />
        </Suspense>
      </div>

      {/* Band 3: the chart anchors, the factors read alongside it. */}
      <RangeTabs
        current={range}
        heading={
          <h2 className="text-xl">
            Your mood over time
            <span className="sr-only"> — choose a range below</span>
          </h2>
        }
      >
        <div
          className={`grid grid-cols-1 items-start lg:grid-cols-3 ${WITHIN_BAND}`}
        >
          <DashboardCard
            eyebrow={range === "year" ? "Weekly average" : "Daily average"}
            title="How you have been"
            className="lg:col-span-2"
          >
            <Suspense fallback={<TrendSkeleton />}>
              <Trend key={savedKey} range={range} timeZone={timeZone} />
            </Suspense>
          </DashboardCard>

          <section aria-label="What went with it">
            <Suspense fallback={<FactorCardsSkeleton />}>
              <Factors key={savedKey} range={range} timeZone={timeZone} />
            </Suspense>
          </section>
        </div>
      </RangeTabs>

      {/* Band 4 */}
      <div
        className={`grid grid-cols-1 items-start lg:grid-cols-3 ${WITHIN_BAND}`}
      >
        {/* The calendar is a fixed-width texture, so it takes the narrow
            column. Entries are text and need the room. */}
        <DashboardCard
          eyebrow="This month"
          title="Day by day"
          description="Choose a day to open it."
        >
          <Suspense fallback={<CalendarSkeleton />}>
            <Calendar key={savedKey} timeZone={timeZone} />
          </Suspense>
        </DashboardCard>

        <DashboardCard
          eyebrow="Lately"
          title="Last few entries"
          className="lg:col-span-2"
          action={
            <Link
              href="/dashboard/journal"
              className="text-muted hover:text-ink text-sm underline underline-offset-2"
            >
              See all
            </Link>
          }
        >
          <Suspense fallback={<EntryListSkeleton count={RECENT_COUNT} />}>
            <Lately key={savedKey} timeZone={timeZone} />
          </Suspense>
        </DashboardCard>
      </div>
    </div>
  );
}

async function CheckIn() {
  const tags = await getTags();
  return <EntryForm tags={tags} collapsible submitLabel="Log this moment" />;
}

async function Insight({
  range,
  timeZone,
}: {
  range: Range;
  timeZone: string;
}) {
  const window = resolveRange(range, timeZone);

  const [exercise, sleep] = await Promise.all([
    getMoodByExercise(window),
    getMoodBySleep(window),
  ]);

  return <InsightCard insight={deriveInsight(exercise, sleep)} />;
}

async function Trend({ range, timeZone }: { range: Range; timeZone: string }) {
  const window = resolveRange(range, timeZone);
  const points = await getMoodOverTime(range, window, timeZone);

  return (
    <Settle delayMs={CASCADE.trend}>
      <MoodTrend points={points} range={range} />
    </Settle>
  );
}

async function Factors({
  range,
  timeZone,
}: {
  range: Range;
  timeZone: string;
}) {
  const window = resolveRange(range, timeZone);

  // Independent aggregates, so they go out together rather than in sequence.
  const [exercise, sleep] = await Promise.all([
    getMoodByExercise(window),
    getMoodBySleep(window),
  ]);

  return (
    <Settle delayMs={CASCADE.factors}>
      <FactorCards exercise={exercise} sleep={sleep} />
    </Settle>
  );
}

/**
 * Fixed to a month whatever the range above says. The heatmap is about the
 * texture of recent days, and a year of tiles is a wall rather than a texture.
 */
async function Calendar({ timeZone }: { timeZone: string }) {
  const month = resolveRange("month", timeZone);

  const days = await getMoodByDay(month, timeZone);
  const dates = datesInWindow(month, timeZone).slice(-CALENDAR_MAX_DAYS);

  return (
    <Settle delayMs={CASCADE.calendar}>
      <MoodCalendar days={days} dates={dates} />
    </Settle>
  );
}

async function Lately({ timeZone }: { timeZone: string }) {
  const entries = await getEntries(RECENT_COUNT);

  return (
    <Settle delayMs={CASCADE.lately}>
      <EntryList
        entries={entries}
        timeZone={timeZone}
        linkToDetail
        // The default copy points at a form "above", which is true in the
        // journal and wrong here: on a wide screen the check-in is a column
        // away, not overhead.
        empty={
          <>
            <p className="text-ink">Nothing here yet.</p>
            <p className="text-muted mt-1 text-sm">
              Whatever you log will show up here, newest first.
            </p>
          </>
        }
      />
    </Settle>
  );
}
