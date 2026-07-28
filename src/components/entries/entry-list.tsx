import type { ReactNode } from "react";
import type { Entry } from "@/lib/data/entries";
import { moodForRating } from "@/lib/moods";
import { Card, EmptyState } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";

// Formats in the server's timezone, so a late entry can show as tomorrow.
// See docs/decisions.md, Known limitations.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function EntryList({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState>
        <p className="text-ink">No entries yet.</p>
        <p className="text-muted mt-1 text-sm">
          Log how you are feeling above. One entry is enough to start.
        </p>
      </EmptyState>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  const mood = moodForRating(entry.rating);

  return (
    <Card as="li">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden="true">
          {mood?.emoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            {/* The label, not the emoji, so this reads as "Good". */}
            <p className="text-ink font-medium">{mood?.label ?? "Logged"}</p>
            <time
              dateTime={entry.loggedAt.toISOString()}
              className="text-subtle font-mono text-xs tabular-nums"
            >
              {dateFormat.format(entry.loggedAt)}
            </time>
          </div>

          {entry.note && (
            <p className="text-ink mt-2 text-lg whitespace-pre-wrap">
              {entry.note}
            </p>
          )}

          <Factors entry={entry} />

          {entry.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <li key={tag.id}>
                  <Tag>{tag.name}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function Factors({ entry }: { entry: Entry }) {
  const facts: ReactNode[] = [];

  if (entry.sleepHours !== null) {
    facts.push(
      <>
        <span className="font-mono tabular-nums">{entry.sleepHours}</span>h
        sleep
      </>,
    );
  }
  // null means unanswered; rendering "No exercise" would invent data.
  if (entry.exercised !== null) {
    facts.push(entry.exercised ? "Exercised" : "No exercise");
  }

  if (facts.length === 0) return null;

  return (
    <p className="text-subtle mt-2 text-xs">
      {facts.map((fact, index) => (
        <span key={index}>
          {index > 0 && " · "}
          {fact}
        </span>
      ))}
    </p>
  );
}
