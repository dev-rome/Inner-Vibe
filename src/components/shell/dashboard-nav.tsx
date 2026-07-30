"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { NAV_ITEMS, isActive, type NavItem } from "./nav-items";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The nav, rendered two ways from one list.
 *
 * A client component only because the active item comes from the pathname.
 * Keeping the item list in a separate module means the shape is shared rather
 * than duplicated between the sidebar and the bottom bar, which is how the two
 * drift apart.
 *
 * aria-current="page" rather than colour alone: the selected item has to be
 * announced, not merely look different.
 */

/** Where both "log" affordances point. The card takes it from there. */
export const CHECK_IN_HREF = "/dashboard#check-in";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      <ul className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <SidebarLink item={item} pathname={pathname} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item, pathname);
  const reduced = useReducedMotion();
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`ease-standard duration-hover relative flex items-center gap-2.5 rounded-sm py-2 pr-2.5 pl-4 text-sm transition-colors ${
        active ? "text-ink font-medium" : "text-muted hover:text-ink"
      }`}
    >
      {/*
       * A thin rule rather than a filled pill. A pill puts a block of accent
       * behind text on every page, which is louder than a nav needs to be and
       * spends the accent on something that is not a choice or an action.
       *
       * The shared layoutId is what makes it travel between items instead of
       * blinking out here and in over there. Reduced motion keeps the marker
       * and drops the journey.
       */}
      {active && (
        <motion.span
          layoutId="sidebar-active"
          aria-hidden="true"
          className="bg-accent absolute top-1/2 left-0 h-5 w-0.75 -translate-y-1/2 rounded-full"
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 230, damping: 29 }
          }
        />
      )}
      <Icon
        className={`size-4.5 ${active ? "text-accent-pressed" : "text-icon"}`}
      />
      {item.label}
    </Link>
  );
}

/**
 * Under lg the sidebar would eat most of a phone screen, so the same items
 * become a bottom bar. Fixed, because the whole point is reaching it without
 * scrolling back to the top.
 *
 * Three destinations rather than four, so the two on the left and the one on
 * the right are each centred in their own half. That keeps the raised button
 * on the true centre line instead of nudging it off to fill a grid.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [today, journal, profile] = NAV_ITEMS;

  return (
    <nav
      aria-label="Main"
      className="border-line bg-surface-raised fixed inset-x-0 bottom-0 z-20 border-t lg:hidden"
    >
      <ul className="flex items-stretch">
        <li className="flex flex-1 justify-around">
          <BarLink item={today} pathname={pathname} />
          <BarLink item={journal} pathname={pathname} />
        </li>

        <li className="relative w-20 shrink-0">
          <Link
            href={CHECK_IN_HREF}
            className="bg-accent text-accent-ink ease-standard hover:bg-accent-hover duration-hover absolute -top-5 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full shadow-md transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
              className="size-6"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="sr-only">Log a moment</span>
          </Link>
        </li>

        <li className="flex flex-1 justify-around">
          <BarLink item={profile} pathname={pathname} />
        </li>
      </ul>
    </nav>
  );
}

function BarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(item, pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 px-4 py-2.5 text-xs ${
        active ? "text-ink font-medium" : "text-muted"
      }`}
    >
      <Icon
        className={`size-5 ${active ? "text-accent-pressed" : "text-icon"}`}
      />
      {item.label}
    </Link>
  );
}
