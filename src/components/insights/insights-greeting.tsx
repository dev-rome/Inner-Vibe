import type { InsightsSummary } from "@/lib/data/insights";

/**
 * Opens the page by saying something true about the reader's own week.
 *
 * Doubles as the empty state, because a first visit does not need a separate
 * screen — it needs the same welcome with nothing to show yet. Splitting them
 * would mean designing two openings for one moment.
 *
 * The copy never evaluates. "You've logged 12 times" is a fact; "you're doing
 * great" would be the app deciding how the week went.
 */
export function InsightsGreeting({ summary }: { summary: InsightsSummary }) {
  const { totalEntries, recentEntries } = summary;

  const headline =
    totalEntries === 0
      ? "Your trends will appear here as you log"
      : recentEntries === 0
        ? "Nothing logged in the last week"
        : `You've logged ${recentEntries} ${recentEntries === 1 ? "time" : "times"} this week`;

  const support =
    totalEntries === 0
      ? "One entry is enough to start. Patterns show up after a handful."
      : recentEntries === 0
        ? "Your earlier entries are all still here whenever you want them."
        : `${totalEntries} ${totalEntries === 1 ? "entry" : "entries"} in total.`;

  return (
    <header className="reveal-rise">
      <h1 className="text-3xl">{headline}</h1>
      <p className="text-muted mt-2 text-lg">{support}</p>
    </header>
  );
}
