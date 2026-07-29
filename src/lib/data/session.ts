import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SessionExpiredError } from "@/lib/data/errors";

/**
 * Session checks that sit with the data rather than above it.
 *
 * The dashboard layout redirects anyone signed out, but a layout is not a
 * gate. Next renders layouts and pages in parallel, so a page's queries are
 * already in flight when the layout decides to redirect: the response is still
 * a redirect, but the queries ran first and failed against RLS on the way.
 * Layouts also do not re-render on client-side navigation, so a session that
 * ends mid-visit is never rechecked there.
 *
 * Putting the check in front of every query fixes both. The layout keeps its
 * redirect, since it is what turns a signed-out visit into a login page instead
 * of a blank shell.
 */

/**
 * The signed-in user, or null.
 *
 * Cached for the request because auth.getUser() validates the token against
 * the auth server: a real round trip, and a page that streams four sections
 * would otherwise make four.
 */
export const getUser = cache(async function getUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/**
 * Guard for reads. Signals by redirecting, which is what a signed-out visitor
 * to a private page should get, and what Server Component render expects.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Guard for writes. Signals by throwing, for the same reason failWrite does:
 * a Server Action wraps its data call in try/catch, which would swallow the
 * control-flow exception redirect() throws and report it as a save failure.
 */
export async function requireUserForWrite(): Promise<User> {
  const user = await getUser();
  if (!user) throw new SessionExpiredError();
  return user;
}
