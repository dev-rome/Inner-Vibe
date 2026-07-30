import Link from "next/link";
import { notFound } from "next/navigation";
import { getEntry } from "@/lib/data/journal";
import { getTags } from "@/lib/data/tags";
import type { EntrySubmission } from "@/app/dashboard/form-state";
import type { Entry } from "@/lib/data/entries";
import { Card } from "@/components/ui/card";
import { EditEntryForm } from "@/components/entries/edit-entry-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEntryPage({ params }: PageProps) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [entry, tags] = await Promise.all([getEntry(id), getTags()]);

  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href={`/dashboard/journal/${entry.id}`}
        className="text-muted hover:text-ink text-sm underline underline-offset-2"
      >
        Back to entry
      </Link>

      <h1 className="mt-6 text-2xl">Edit entry</h1>

      <Card className="mt-6">
        <EditEntryForm id={entry.id} tags={tags} values={toSubmission(entry)} />
      </Card>
    </div>
  );
}

/**
 * The form speaks the wire format, since that is what it round-trips on a
 * failed save. Converting here keeps that conversion in one place rather than
 * scattering String() calls through the JSX.
 */
function toSubmission(entry: Entry): EntrySubmission {
  return {
    rating: String(entry.rating),
    note: entry.note ?? "",
    sleepHours: entry.sleepHours === null ? "" : String(entry.sleepHours),
    exercised: entry.exercised === null ? "" : entry.exercised ? "yes" : "no",
    tagIds: entry.tags.map((tag) => tag.id),
    // Every tag already exists, so none are pending.
    newTagNames: [],
  };
}
