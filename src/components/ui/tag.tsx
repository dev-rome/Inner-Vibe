import type { ComponentProps, ReactNode } from "react";

/**
 * Selectable tag chip.
 *
 * No coral. Tags are not on the accent allowlist, so the selected state is
 * carried by fill, border weight, medium text and a check glyph. The glyph
 * also means selection is not signalled by colour alone (WCAG 1.4.1).
 *
 * Built on a visually hidden checkbox rather than a button with aria-pressed,
 * so selection works with JavaScript disabled and the browser handles the
 * state. sr-only clips it instead of hiding it, keeping it focusable.
 */
const selectableChip = [
  "ease-standard inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors duration-150",
  "border-line bg-surface-raised text-ink",
  "hover:border-line-strong",
  "peer-checked:border-line-strong peer-checked:bg-surface-sunken peer-checked:font-medium",
  "peer-checked:before:mr-1 peer-checked:before:content-['✓']",
  "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
].join(" ");

type TagCheckboxProps = Omit<ComponentProps<"input">, "type" | "className"> & {
  label: string;
};

export function TagCheckbox({ label, ...props }: TagCheckboxProps) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className={selectableChip}>{label}</span>
    </label>
  );
}

/** Read-only chip, for showing which tags an entry already carries. */
export function Tag({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`border-line text-subtle inline-flex rounded-full border px-2.5 py-0.5 text-xs ${className}`}
    >
      {children}
    </span>
  );
}
