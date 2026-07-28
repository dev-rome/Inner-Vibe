import { signout } from "../(auth)/actions";
import { getEntries } from "@/lib/data/entries";
import { getTags } from "@/lib/data/tags";
import { EntryForm } from "@/components/entries/entry-form";
import { EntryList } from "@/components/entries/entry-list";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

export default async function Dashboard() {
  const [tags, entries] = await Promise.all([getTags(), getEntries()]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">InnerVibe</h1>
        <form action={signout}>
          <SubmitButton
            variant="secondary"
            size="sm"
            pendingLabel="Logging out…"
          >
            Log out
          </SubmitButton>
        </form>
      </header>

      <Card className="mt-8">
        <EntryForm tags={tags} />
      </Card>

      <section className="mt-12">
        <h2 className="text-xl">Your entries</h2>
        <div className="mt-4">
          <EntryList entries={entries} />
        </div>
      </section>
    </main>
  );
}
