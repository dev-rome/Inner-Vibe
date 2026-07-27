import { signout } from "../(auth)/actions";
import { getEntries } from "@/lib/data/entries";
import { getTags } from "@/lib/data/tags";
import { EntryForm } from "@/components/entries/entry-form";
import { EntryList } from "@/components/entries/entry-list";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function Dashboard() {
  const [tags, entries] = await Promise.all([getTags(), getEntries()]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl">InnerVibe</h1>
        <form action={signout}>
          <SubmitButton
            variant="secondary"
            pendingLabel="Logging out…"
            className="px-3 py-1.5 text-sm"
          >
            Log out
          </SubmitButton>
        </form>
      </header>

      <div className="border-line bg-surface-raised mt-8 rounded-lg border p-4 sm:p-6">
        <EntryForm tags={tags} />
      </div>

      <section className="mt-12">
        <h2 className="text-xl">Your entries</h2>
        <div className="mt-4">
          <EntryList entries={entries} />
        </div>
      </section>
    </main>
  );
}
