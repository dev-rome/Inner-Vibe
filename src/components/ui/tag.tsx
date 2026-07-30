import type { ComponentProps, ReactNode } from "react";

// No coral: tags are not on the accent allowlist. Selection reads through
// fill, border weight and a check glyph, so it is never colour alone.
const chip = [
  "ease-standard inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors duration-hover",
  "border-line bg-surface-raised text-ink",
  "peer-hover:border-line-strong",
  "peer-checked:border-line-strong peer-checked:bg-surface-sunken peer-checked:font-medium",
  "peer-checked:before:mr-1 peer-checked:before:content-['✓']",
  "peer-focus-visible:outline-focus peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
].join(" ");

type TagCheckboxProps = Omit<ComponentProps<"input">, "type" | "className"> & {
  label: string;
  /** Applied to the visible chip, not the hidden input. */
  className?: string;
};

// A real checkbox, so selection survives with JavaScript off. sr-only clips it
// rather than hiding it, keeping it focusable.
export function TagCheckbox({
  label,
  className = "",
  disabled,
  ...props
}: TagCheckboxProps) {
  return (
    <label className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
      <input
        type="checkbox"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span className={`${chip} ${className}`}>{label}</span>
    </label>
  );
}

// Read-only chip, for tags an entry already carries.
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
