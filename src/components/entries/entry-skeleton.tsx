import { Card } from "@/components/ui/card";

/**
 * Placeholder while a page of history streams in.
 *
 * aria-hidden with a live region alongside: a screen reader gains nothing from
 * hearing the shape of pretend content, but does need to know the page is
 * still working. The pulse is a Tailwind animation, so the global
 * reduced-motion rule settles it rather than flashing.
 */
export function EntryListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      <p role="status" className="sr-only">
        Loading entries…
      </p>

      <ul aria-hidden="true" className="flex animate-pulse flex-col gap-3">
        {Array.from({ length: count }, (_, index) => (
          <Card as="li" key={index}>
            <div className="flex items-start gap-3">
              <div className="bg-surface-sunken size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <div className="bg-surface-sunken h-4 w-24 rounded-sm" />
                  <div className="bg-surface-sunken h-3 w-28 rounded-sm" />
                </div>
                <div className="bg-surface-sunken mt-3 h-4 w-full rounded-sm" />
                <div className="bg-surface-sunken mt-2 h-4 w-2/3 rounded-sm" />
                <div className="mt-3 flex gap-1.5">
                  <div className="bg-surface-sunken h-5 w-16 rounded-full" />
                  <div className="bg-surface-sunken h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </ul>
    </>
  );
}
