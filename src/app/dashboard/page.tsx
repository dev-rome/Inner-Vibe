import Link from "next/link";
import { Suspense } from "react";
import { signout } from "../(auth)/actions";
import { getEntries } from "@/lib/data/entries";
import { getTags } from "@/lib/data/tags";
import { getTimeZone } from "@/lib/data/profile";
import { EntryForm } from "@/components/entries/entry-form";
import { EntryList } from "@/components/entries/entry-list";
import { EntryListSkeleton } from "@/components/entries/entry-skeleton";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

const RECENT_COUNT = 3;

export default async function Dashboard() {
  const tags = await getTags();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">InnerVibe</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/settings"
            className="text-muted hover:text-ink text-sm underline underline-offset-2"
          >
            Settings
          </Link>
          <form action={signout}>
            <SubmitButton
              variant="secondary"
              size="sm"
              pendingLabel="Logging out…"
            >
              Log out
            </SubmitButton>
          </form>
        </div>
      </header>

      <Card className="mt-8">
        <EntryForm tags={tags} />
      </Card>

      {/*
       * The dashboard shows only the last few. The full history lives in the
       * journal, so this page does not grow without bound as entries pile up.
       */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">Recent</h2>
          <Link
            href="/dashboard/journal"
            className="text-muted hover:text-ink text-sm underline underline-offset-2"
          >
            View journal
          </Link>
        </div>

        <div className="mt-4">
          <Suspense fallback={<EntryListSkeleton count={RECENT_COUNT} />}>
            <Recent />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

async function Recent() {
  const [entries, timeZone] = await Promise.all([
    getEntries(RECENT_COUNT),
    getTimeZone(),
  ]);

  return <EntryList entries={entries} timeZone={timeZone} linkToDetail />;
}
