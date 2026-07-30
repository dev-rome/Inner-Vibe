import type { InsightsSummary } from "@/lib/data/insights";

/**
 * The small card pinned to the bottom of the sidebar.
 *
 * Deliberately a count, not a streak. A streak turns a quiet week into a loss
 * and pressures people to log for the number rather than for themselves, which
 * is the opposite of what this app is for. These two figures only ever go up,
 * so there is nothing here to break.
 *
 * The copy never evaluates: "12 this week" is a fact, "great work" would be the
 * app deciding how the week went.
 */
export function SidebarContext({ summary }: { summary: InsightsSummary }) {
  const { totalEntries, recentEntries } = summary;

  if (totalEntries === 0) {
    return (
      <div className="border-line bg-surface-sunken rounded-md border p-3">
        <p className="text-muted text-xs">
          Your first entry starts the picture.
        </p>
      </div>
    );
  }

  return (
    <div className="border-line bg-surface-sunken rounded-md border p-3">
      <p className="text-subtle text-xs tracking-wider uppercase">This week</p>
      <p className="text-ink mt-1.5 font-mono text-2xl tabular-nums">
        {recentEntries}
      </p>
      <p className="text-muted mt-0.5 text-xs">
        {recentEntries === 1 ? "entry" : "entries"} logged ·{" "}
        <span className="font-mono tabular-nums">{totalEntries}</span> in total
      </p>
    </div>
  );
}
