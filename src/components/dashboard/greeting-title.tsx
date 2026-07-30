import Link from "next/link";
import { greeting } from "@/lib/greeting";

/**
 * The greeting, with a way to change what it calls you.
 *
 * Without an affordance here the name is invisible: it lives in Settings, and
 * nothing on the page it affects says so. The two states are deliberately
 * different — a pencil is enough once a name exists, but it reads as decoration
 * to someone who has never set one, so that case gets words.
 */
export function GreetingTitle({
  displayName,
  timeZone,
}: {
  displayName: string | null;
  timeZone: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {greeting(displayName, timeZone)}

      {displayName ? (
        <Link
          href="/dashboard/profile"
          aria-label="Change your name"
          title="Change your name"
          className="text-icon hover:text-ink hover:bg-surface-sunken ease-standard rounded-sm p-1.5 transition-colors duration-150"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4"
          >
            <path d="M4 20h4L19 9l-4-4L4 16z" />
          </svg>
        </Link>
      ) : (
        <Link
          href="/dashboard/profile"
          className="text-muted hover:text-ink text-sm font-normal underline underline-offset-2"
        >
          Add your name
        </Link>
      )}
    </span>
  );
}
