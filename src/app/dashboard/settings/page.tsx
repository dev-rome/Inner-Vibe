import Link from "next/link";
import { getTimeZone } from "@/lib/data/profile";
import { Card } from "@/components/ui/card";
import { TimeZoneForm } from "@/components/settings/time-zone-form";

export default async function SettingsPage() {
  const timeZone = await getTimeZone();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8">
      <Link
        href="/dashboard"
        className="text-muted hover:text-ink text-sm underline underline-offset-2"
      >
        Back to log
      </Link>

      <h1 className="mt-6 text-2xl">Settings</h1>

      <Card className="mt-6">
        <TimeZoneForm current={timeZone} />
      </Card>
    </main>
  );
}
