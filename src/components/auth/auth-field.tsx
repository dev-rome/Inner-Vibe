import { Input } from "@/components/ui/input";

type AuthFieldProps = {
  id: string;
  name: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
  minLength?: number;
};

export function AuthField({
  id,
  name,
  label,
  type,
  autoComplete,
  defaultValue,
  errors,
  hint,
  minLength,
}: AuthFieldProps) {
  const hasError = Boolean(errors?.length);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Both ids when both exist: aria-describedby takes a list, and dropping the
  // hint the moment an error appears would hide the password rule exactly when
  // the user needs it.
  const describedBy =
    [hint ? hintId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="text-ink block text-sm font-medium">
        {label}
      </label>

      {hint && (
        <p id={hintId} className="text-subtle mt-1 text-xs">
          {hint}
        </p>
      )}

      <Input
        id={id}
        name={name}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        className="mt-1.5 w-full"
      />

      {hasError && (
        <p id={errorId} className="text-status-error mt-1.5 text-sm">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
}
