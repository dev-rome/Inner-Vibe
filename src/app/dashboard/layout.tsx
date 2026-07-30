import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/data/session";
import { getProfile } from "@/lib/data/profile";
import { getInsightsSummary } from "@/lib/data/insights";
import { signout } from "../(auth)/actions";
import {
  BottomNav,
  CHECK_IN_HREF,
  SidebarNav,
} from "@/components/shell/dashboard-nav";
import { SidebarContext } from "@/components/shell/sidebar-context";
import { buttonClasses } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * The shell every dashboard route renders inside.
 *
 * The auth call here turns a signed-out visit into the login page rather than a
 * blank frame. It is not the gate, though: Next renders this in parallel with
 * the page, and a layout does not re-render on client-side navigation, so the
 * checks that actually protect the data sit in front of every query in the data
 * layer.
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

  return (
    <div className="min-h-dvh lg:flex">
      {/*
       * With nav on every page, a keyboard user would otherwise tab through
       * five links before reaching the content on every single navigation.
       */}
      <a
        href="#main"
        className="bg-surface-raised text-ink border-line sr-only rounded-md border px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      {/*
       * Sticky and one viewport tall, not as tall as the document.
       *
       * As a plain flex child it stretched to the full page height, so mt-auto
       * pushed the context card and sign-out to the bottom of the *scroll*,
       * hundreds of pixels below the fold. Pinning it to the viewport is what
       * makes "bottom of the sidebar" mean the bottom of what you can see.
       */}
      <aside className="border-line bg-surface-raised hidden w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Link
          href="/dashboard"
          className="font-display text-ink px-4 text-lg font-semibold tracking-tight"
        >
          InnerVibe
        </Link>

        <SidebarNav />

        <Link href={CHECK_IN_HREF} className={`${buttonClasses()} mx-1`}>
          Log a moment
        </Link>

        {/* Pinned to the bottom, above sign-out: context, not navigation. */}
        <div className="mt-auto flex flex-col gap-4">
          <Suspense fallback={<ContextSkeleton />}>
            <Context />
          </Suspense>

          <form action={signout} className="px-1">
            <SubmitButton
              variant="secondary"
              size="sm"
              pendingLabel="Logging out…"
            >
              Log out
            </SubmitButton>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* The sidebar is hidden on small screens, so the brand and the only
            non-nav control need somewhere to live. */}
        <header className="border-line bg-surface-raised flex items-center justify-between border-b px-5 py-3 lg:hidden">
          <Link
            href="/dashboard"
            className="font-display text-ink text-base font-semibold tracking-tight"
          >
            InnerVibe
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
        </header>

        {/* Bottom padding clears the fixed bottom bar and its raised button. */}
        <main id="main" className="flex-1 pb-28 lg:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

async function Context() {
  const { timeZone } = await getProfile();
  const summary = await getInsightsSummary(timeZone);

  return <SidebarContext summary={summary} />;
}

function ContextSkeleton() {
  return (
    <div
      className="bg-surface-sunken h-24 animate-pulse rounded-md"
      aria-hidden="true"
    />
  );
}
