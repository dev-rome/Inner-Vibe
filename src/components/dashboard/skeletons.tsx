import { Card } from "@/components/ui/card";

/*
 * Placeholders for the dashboard's streamed sections.
 *
 * Each one is shaped and sized like the thing it stands in for, so the layout
 * does not shift when the real content lands. That is the whole job: a
 * placeholder that is the wrong height is worse than no placeholder, because it
 * moves everything below it twice.
 *
 * Every skeleton here is a card *body*. The sections they fill already sit
 * inside a DashboardCard, and wrapping them in a Card of their own drew a
 * second border and a second padding box that vanished on load. FactorCards is
 * the exception: it renders its own cards, so its placeholder does too.
 *
 * Blocks are aria-hidden with one live region alongside. The outline of pretend
 * content is noise to a screen reader; "still loading" is not.
 */

function Block({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

function Status({ children }: { children: string }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}

/** Six tiles and the hint, matching the collapsed check-in exactly. */
export function CheckInSkeleton() {
  return (
    <>
      <Status>Loading your check-in…</Status>
      <div aria-hidden="true">
        {/* Stands in for the "How are you feeling?" legend. */}
        <Block className="h-5 w-44" />

        <div className="mt-3 grid grid-cols-6 gap-1.5 sm:gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Block key={index} className="aspect-square w-full" />
          ))}
        </div>

        <div className="mt-2 flex justify-between">
          <Block className="h-3 w-16" />
          <Block className="h-3 w-16" />
        </div>

        <Block className="mt-4 h-4 w-64 max-w-full" />
      </div>
    </>
  );
}

/**
 * The one inverted placeholder, because the card it fills is the one dark
 * surface. A pale block here would flash light then go dark.
 */
export function InsightSkeleton() {
  return (
    <Card tone="inverted" className="flex flex-col gap-6">
      <Status>Looking for a pattern…</Status>
      <div
        aria-hidden="true"
        className="skeleton size-9 shrink-0 rounded-full bg-white/15"
      />
      <div aria-hidden="true">
        <div className="skeleton h-5 w-40 rounded-md bg-white/15" />
        <div className="skeleton mt-3 h-3.5 w-full rounded-md bg-white/10" />
        <div className="skeleton mt-2 h-3.5 w-4/5 rounded-md bg-white/10" />
      </div>
    </Card>
  );
}

/** Matches the chart's h-64 box so the card does not resize on load. */
export function TrendSkeleton() {
  return (
    <>
      <Status>Loading your trend…</Status>
      <div aria-hidden="true" className="flex h-64 w-full gap-3">
        {/* The emoji axis, then the plot area. */}
        <div className="flex w-8 shrink-0 flex-col justify-between py-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Block key={index} className="size-4 rounded-full" />
          ))}
        </div>
        <div className="flex flex-1 flex-col justify-end gap-3">
          <Block className="h-full w-full rounded-lg" />
          <Block className="h-3 w-full" />
        </div>
      </div>
    </>
  );
}

/**
 * Renders its own cards, unlike the others: FactorCards does too, and the
 * container query has to match or the grid reflows when the real one arrives.
 */
export function FactorCardsSkeleton() {
  return (
    <div className="@container">
      <Status>Loading what went with it…</Status>
      <div aria-hidden="true" className="grid gap-4 @lg:grid-cols-2">
        {[0, 1].map((index) => (
          <Card key={index}>
            <Block className="h-4 w-32" />
            <Block className="mt-2 h-3 w-44 max-w-full" />
            <div className="mt-5">
              <Block className="h-3.5 w-28" />
              <Block className="mt-2 h-1.5 w-full rounded-full" />
              <Block className="mt-2 h-3 w-16" />
            </div>
            <div className="mt-4">
              <Block className="h-3.5 w-24" />
              <Block className="mt-2 h-1.5 w-full rounded-full" />
              <Block className="mt-2 h-3 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Capped at the same width as the calendar, with its weekday row and legend. */
export function CalendarSkeleton({ tiles = 35 }: { tiles?: number }) {
  return (
    <>
      <Status>Loading your calendar…</Status>
      <div aria-hidden="true" className="w-full max-w-80">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, index) => (
            <Block key={index} className="mx-auto h-3 w-6" />
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-1.5">
          {Array.from({ length: tiles }, (_, index) => (
            <Block key={index} className="aspect-square w-full" />
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <Block className="h-3 w-28" />
        </div>
      </div>
    </>
  );
}
