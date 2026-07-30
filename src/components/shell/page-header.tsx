import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  /** One line saying what the page is for. Optional. */
  description?: ReactNode;
  /** Right-hand slot: a date, a filter, a link. */
  actions?: ReactNode;
};

/**
 * The h1 for a dashboard route.
 *
 * Every route had its own header markup and its own "back to log" link, which
 * is what made the app read as four pages rather than one. The nav in the shell
 * replaces the back links; this replaces the headers.
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="text-muted mt-1.5">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

/** A quiet, non-interactive pill. Dates and counts, not actions. */
export function HeaderPill({ children }: { children: ReactNode }) {
  return (
    <span className="border-line bg-surface-raised text-muted inline-flex items-center rounded-full border px-3.5 py-1.5 font-mono text-xs tabular-nums">
      {children}
    </span>
  );
}
