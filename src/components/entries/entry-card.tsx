import type { ReactNode } from "react";
import Link from "next/link";
import type { Entry } from "@/lib/data/entries";
import { moodForRating } from "@/lib/moods";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";

// Formatters are expensive to build and the zone rarely changes, so keep one
// per zone rather than one per card.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let existing = formatters.get(timeZone);
  if (!existing) {
    existing = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatters.set(timeZone, existing);
  }
  return existing;
}

type EntryCardProps = {
  entry: Entry;
  timeZone: string;
  href?: string;
};

export function EntryCard({ entry, timeZone, href }: EntryCardProps) {
  const mood = moodForRating(entry.rating);
  const label = mood?.label ?? "Logged";

  const body = (
    <div className="flex items-start gap-3">
      <span className="text-2xl leading-none" aria-hidden="true">
        {mood?.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-ink font-medium">{label}</p>
          <time
            dateTime={entry.loggedAt.toISOString()}
            className="text-subtle font-mono text-xs tabular-nums"
          >
            {formatter(timeZone).format(entry.loggedAt)}
          </time>
        </div>

        {entry.note && (
          <p className="text-ink mt-2 line-clamp-3 text-lg whitespace-pre-wrap">
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
  );

  if (!href) {
    return <Card as="li">{body}</Card>;
  }

  return (
    // focus-within moves the ring onto the card, since the link itself is only
    // a screen-reader label.
    <Card
      as="li"
      className={[
        // relative, or the stretched pseudo-element below covers the viewport.
        "relative",
        // A card-sized target with no hover state gives no sign it can be
        // opened until you are already on it. Border and shadow only, so
        // nothing moves and the list stays still under the cursor.
        "ease-standard hover:border-line-strong duration-hover transition-[border-color,box-shadow] hover:shadow-md",
        "focus-within:outline-focus focus-within:outline-2 focus-within:outline-offset-2",
      ].join(" ")}
    >
      {/*
       * One link covering the card, stretched over it rather than wrapping the
       * markup. Wrapping would put the tag list inside an anchor, and a link
       * inside a link is invalid. The accessible name is the mood and time, so
       * the list does not read as a wall of identical "read more" links.
       */}
      <Link
        href={href}
        className="after:absolute after:inset-0 after:content-['']"
        aria-label={`${label}, ${formatter(timeZone).format(entry.loggedAt)}`}
      >
        <span className="sr-only">View entry</span>
      </Link>
      {body}
    </Card>
  );
}

function Factors({ entry }: { entry: Entry }): ReactNode {
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
