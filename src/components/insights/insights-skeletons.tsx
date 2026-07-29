import { Card } from "@/components/ui/card";

/*
 * Soft sage shapes rather than spinners.
 *
 * A spinner says "waiting"; a shape the size of the thing that is coming says
 * "this is arriving", and the layout does not jump when it does. All of these
 * are aria-hidden with one live region alongside, because the outline of
 * pretend content is noise to a screen reader while "still loading" is not.
 */

function Block({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md ${className}`} />;
}

export function GreetingSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <Block className="h-9 w-3/4 max-w-md" />
      <Block className="mt-3 h-6 w-40" />
    </div>
  );
}

export function TrendSkeleton() {
  return (
    <Card>
      <p role="status" className="sr-only">
        Loading your trend…
      </p>
      <div className="animate-pulse" aria-hidden="true">
        <Block className="h-4 w-32" />
        <Block className="mt-4 h-64 w-full" />
      </div>
    </Card>
  );
}

export function FactorCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <p role="status" className="sr-only">
        Loading your factors…
      </p>
      {[0, 1].map((index) => (
        <Card key={index}>
          <div className="animate-pulse" aria-hidden="true">
            <Block className="h-4 w-28" />
            <Block className="mt-2 h-3 w-40" />
            <Block className="mt-5 h-1.5 w-full" />
            <Block className="mt-5 h-1.5 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CalendarSkeleton({ tiles = 28 }: { tiles?: number }) {
  return (
    <Card>
      <p role="status" className="sr-only">
        Loading your calendar…
      </p>
      <div className="animate-pulse" aria-hidden="true">
        <Block className="h-4 w-24" />
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: tiles }, (_, index) => (
            <Block key={index} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}
