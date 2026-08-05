/**
 * The timeline before the entries arrive.
 *
 * Shaped like a closed row — the face circle, two lines of text, the caret —
 * because that is what lands. Placeholders that are the wrong height move
 * everything below them twice, once to appear and once to be replaced.
 */
export function TimelineSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mt-2">
      <p role="status" className="sr-only">
        Loading your journal…
      </p>

      <div aria-hidden="true">
        <div className="flex items-baseline gap-3 py-1.5">
          <div className="skeleton h-4 w-28 rounded-md" />
          <div className="skeleton h-3 w-16 rounded-md" />
        </div>

        <ul className="mt-3 flex flex-col gap-2.5">
          {Array.from({ length: rows }, (_, index) => (
            <li
              key={index}
              className="border-line bg-surface-raised relative flex items-center gap-4 overflow-hidden rounded-xl border py-4 pr-5 pl-6 shadow-sm"
            >
              <span className="skeleton absolute inset-y-0 left-0 w-1 rounded-none" />
              <div className="skeleton size-13 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2.5">
                  <div className="skeleton h-4 w-24 rounded-md" />
                  <div className="skeleton h-3 w-28 rounded-md" />
                </div>
                <div className="skeleton mt-2 h-3.5 w-4/5 rounded-md" />
              </div>
              <div className="skeleton size-4 shrink-0 rounded-sm" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
