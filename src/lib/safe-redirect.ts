export const DEFAULT_DESTINATION = "/dashboard";

/**
 * Resolve an untrusted `next` parameter to a same-origin URL.
 *
 * The bug this exists to prevent: `${origin}${next}` with `next=//evil.com`
 * produces `https://ours.app//evil.com`, which browsers read as a
 * protocol-relative URL and follow off-site.
 *
 * Parsing through the URL constructor and comparing origins delegates to the
 * same normalisation the browser will apply, so backslash variants, leading
 * whitespace, absolute URLs and non-http schemes are all caught without a
 * hand-written list of cases to keep up to date.
 */
export function resolveDestination(next: string | null, base: URL): URL {
  const fallback = new URL(DEFAULT_DESTINATION, base);
  if (!next) return fallback;

  try {
    const target = new URL(next, base);
    return target.origin === base.origin ? target : fallback;
  } catch {
    return fallback;
  }
}
