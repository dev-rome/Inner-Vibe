import { describe, expect, it } from "vitest";
import { isSessionError } from "./errors";

describe("isSessionError", () => {
  /*
   * The one that prompted this. PostgREST rejects a token whose iat is ahead
   * of its own clock, which is unrecoverable by retrying: every attempt
   * resends the same credential. It has to route to a fresh login.
   */
  it("treats a forward-dated token as a session problem", () => {
    expect(
      isSessionError({ code: "PGRST301", message: "JWT issued at future" }),
    ).toBe(true);
  });

  it.each([
    ["expired", "PGRST301", "JWT expired"],
    ["bad signature", "PGRST301", "JWSError JWSInvalidSignature"],
    ["anonymous disallowed", "PGRST302", "anonymous access is disabled"],
  ])("treats %s as a session problem", (_label, code, message) => {
    expect(isSessionError({ code, message })).toBe(true);
  });

  // Matched on the message too, because the code is not always populated on
  // the error object the client surfaces.
  it("catches a JWT complaint with no code", () => {
    expect(isSessionError({ message: "invalid JWT: unable to parse" })).toBe(
      true,
    );
    expect(isSessionError({ code: null, message: "JWT expired" })).toBe(true);
  });

  /*
   * These must NOT redirect. A connection failure is worth retrying, and a
   * missing GRANT or a constraint violation is a bug we need to see rather
   * than disguise as a logged-out user.
   */
  it.each([
    ["connection failure", undefined, "fetch failed"],
    ["missing grant", "42501", "permission denied for table entries"],
    [
      "check constraint",
      "23514",
      'new row violates check constraint "rating_range"',
    ],
    [
      "unique violation",
      "23505",
      "duplicate key value violates unique constraint",
    ],
    ["undefined table", "42P01", 'relation "entries" does not exist'],
  ])("leaves %s to the error boundary", (_label, code, message) => {
    expect(isSessionError({ code, message })).toBe(false);
  });

  // "jwt" as a substring of an unrelated word must not trip the match.
  it("does not match jwt inside another word", () => {
    expect(isSessionError({ message: "column jwtoken does not exist" })).toBe(
      false,
    );
  });
});
