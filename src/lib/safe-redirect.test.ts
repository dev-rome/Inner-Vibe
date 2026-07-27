import { describe, expect, it } from "vitest";
import { DEFAULT_DESTINATION, resolveDestination } from "./safe-redirect";

const BASE = new URL("https://ours.app/callback");

function resolve(next: string | null) {
  return resolveDestination(next, BASE).toString();
}

const FALLBACK = `https://ours.app${DEFAULT_DESTINATION}`;

describe("resolveDestination", () => {
  it("falls back when there is no destination", () => {
    expect(resolve(null)).toBe(FALLBACK);
    expect(resolve("")).toBe(FALLBACK);
  });

  it("allows a same-origin path", () => {
    expect(resolve("/dashboard")).toBe("https://ours.app/dashboard");
    expect(resolve("/")).toBe("https://ours.app/");
  });

  it("keeps the query and fragment on an allowed path", () => {
    expect(resolve("/dashboard?tab=week#top")).toBe(
      "https://ours.app/dashboard?tab=week#top",
    );
  });

  /*
   * Each of these sends the user off-site if `next` is concatenated onto the
   * origin instead of parsed. The protocol-relative form is the classic one:
   * "https://ours.app" + "//evil.com" is a URL pointing at evil.com.
   */
  it.each([
    ["protocol-relative", "//evil.com"],
    ["absolute url", "https://evil.com/phish"],
    ["backslash variant", "/\\evil.com"],
    ["mixed slash variant", "\\/evil.com"],
    ["leading whitespace", "   //evil.com"],
    ["scheme with credentials", "https://ours.app@evil.com"],
  ])("blocks an off-origin destination (%s)", (_label, next) => {
    expect(resolve(next)).toBe(FALLBACK);
  });

  it("blocks a non-http scheme", () => {
    expect(resolve("javascript:alert(1)")).toBe(FALLBACK);
    expect(resolve("data:text/html,<script>alert(1)</script>")).toBe(FALLBACK);
  });

  // Same-origin, so not a redirect problem. It resolves to a path that simply
  // does not exist, which is a 404 rather than a security concern.
  it("allows traversal that stays on the origin", () => {
    expect(resolve("../../etc")).toBe("https://ours.app/etc");
  });
});
