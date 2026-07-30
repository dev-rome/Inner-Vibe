import Link from "next/link";
import { notFound } from "next/navigation";
import { getEntry } from "@/lib/data/journal";
import { getTimeZone } from "@/lib/data/profile";
import { moodForRating } from "@/lib/moods";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { DeleteEntryButton } from "@/components/entries/delete-entry-button";
import { buttonClasses } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EntryDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Not a uuid cannot match a row, and asking Postgres to compare it raises
  // rather than returning empty.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [entry, timeZone] = await Promise.all([getEntry(id), getTimeZone()]);

  // getEntry returns null both for "no such entry" and "not yours", because
  // RLS filters it out either way. A 404 for both leaks nothing.
  if (!entry) notFound();

  const mood = moodForRating(entry.rating);
  const stamp = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(entry.loggedAt);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href="/dashboard/journal"
        className="text-muted hover:text-ink text-sm underline underline-offset-2"
      >
        Back to journal
      </Link>

      <Card className="mt-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl leading-none" aria-hidden="true">
            {mood?.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl">{mood?.label ?? "Logged"}</h1>
            <time
              dateTime={entry.loggedAt.toISOString()}
              className="text-subtle mt-1 block font-mono text-xs tabular-nums"
            >
              {stamp}
            </time>
          </div>
        </div>

        {entry.note && (
          <p className="text-ink mt-6 text-lg whitespace-pre-wrap">
            {entry.note}
          </p>
        )}

        <dl className="border-line mt-6 grid grid-cols-2 gap-4 border-t pt-6 text-sm">
          <div>
            <dt className="text-muted">Sleep</dt>
            <dd className="text-ink mt-1">
              {entry.sleepHours === null ? (
                <span className="text-subtle">Not recorded</span>
              ) : (
                <>
                  <span className="font-mono tabular-nums">
                    {entry.sleepHours}
                  </span>
                  {" hours"}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Exercise</dt>
            <dd className="text-ink mt-1">
              {entry.exercised === null ? (
                <span className="text-subtle">Not recorded</span>
              ) : entry.exercised ? (
                "Yes"
              ) : (
                "No"
              )}
            </dd>
          </div>
        </dl>

        <div className="border-line mt-6 border-t pt-6">
          <h2 className="text-muted text-sm">Tags</h2>
          {entry.tags.length === 0 ? (
            <p className="text-subtle mt-2 text-sm">None</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <li key={tag.id}>
                  <Tag>{tag.name}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href={`/dashboard/journal/${entry.id}/edit`}
          className={buttonClasses("secondary")}
        >
          Edit
        </Link>
        <DeleteEntryButton id={entry.id} />
      </div>
    </div>
  );
}
