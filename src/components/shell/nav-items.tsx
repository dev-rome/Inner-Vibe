import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Today",
    // Exact match only. Every other route is nested under this one, so
    // startsWith would light it up everywhere.
    exact: true,
    icon: (props: IconProps) => (
      <Icon {...props}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H4a1 1 0 0 1-1-1z" />
      </Icon>
    ),
  },
  {
    href: "/dashboard/journal",
    label: "Journal",
    exact: false,
    icon: (props: IconProps) => (
      <Icon {...props}>
        <path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z" />
        <path d="M8 8.5h7M8 12.5h7" />
      </Icon>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    exact: false,
    icon: (props: IconProps) => (
      <Icon {...props}>
        <circle cx="12" cy="8.5" r="3.8" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </Icon>
    ),
  },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

/**
 * Whether a nav item owns the current route.
 *
 * The journal detail and edit pages are still "Journal", so nesting counts —
 * except for the index, which everything nests under.
 */
export function isActive(item: NavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}
