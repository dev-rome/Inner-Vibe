import { redirect } from "next/navigation";
import { getUser } from "@/lib/data/session";

/**
 * Turns a signed-out visit into the login page rather than a blank shell.
 *
 * Not the gate, though. Next renders this in parallel with the page, so the
 * page's queries are already in flight when this decides to redirect, and a
 * layout does not re-render on client-side navigation. The checks that
 * actually protect the data sit in front of every query in the data layer.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
