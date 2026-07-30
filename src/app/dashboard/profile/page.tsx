import { getProfile } from "@/lib/data/profile";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { DisplayNameForm } from "@/components/profile/display-name-form";
import { TimeZoneForm } from "@/components/profile/time-zone-form";

export default async function SettingsPage() {
  const { timeZone, displayName } = await getProfile();

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-8">
      <PageHeader
        title="Settings"
        description="How the app addresses you, and how it counts a day."
      />

      {/* Separate forms, separate saves: one field failing validation must not
          hold the other's change hostage. */}
      <Card className="mt-8">
        <DisplayNameForm current={displayName} />
      </Card>

      <Card className="mt-4">
        <TimeZoneForm current={timeZone} />
      </Card>
    </div>
  );
}
