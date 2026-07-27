import { redirect } from "next/navigation";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";

type SupabaseErrorShape = {
  code?: string | null;
  message: string;
};

// PostgREST reports JWT problems under these codes: expired, malformed,
// wrong signature, and "issued at future" when its clock is behind the one
// that minted the token.
const SESSION_ERROR_CODES = new Set(["PGRST301", "PGRST302"]);

/**
 * Distinguishes "your session is unusable" from "the database is unreachable".
 *
 * The distinction matters because the two need opposite responses. A broken
 * connection deserves a retry button. A broken token makes retrying pointless,
 * because every attempt resends the same bad credential; the only way out is a
 * fresh login.
 */
export function isSessionError(error: SupabaseErrorShape): boolean {
  if (error.code && SESSION_ERROR_CODES.has(error.code)) return true;
  return /\bjwt\b/i.test(error.message);
}

/**
 * Fail a read.
 *
 * Redirects on a session error rather than throwing, because reads happen
 * during Server Component render where nothing catches, so redirect()
 * propagates to Next as intended. Everything else throws and lands on the
 * route's error boundary, where a retry button is the right offer.
 *
 * Reaching for next/navigation from the data layer adds no coupling that was
 * not already there: these functions call createClient(), which reads
 * next/headers, so this module has never been runnable outside a Next request.
 */
export function failRead(resource: string, error: SupabaseErrorShape): never {
  if (isSessionError(error)) {
    redirect(`/login?error=${AUTH_ERROR_CODES.sessionExpired}`);
  }

  throw new Error(`Failed to fetch ${resource}: ${error.message}`);
}

/**
 * Thrown by writes instead of redirecting.
 *
 * A Server Action wraps its data call in try/catch, which would swallow the
 * control-flow exception redirect() throws and report it as a generic save
 * failure. Signalling with a typed error lets the action redirect from outside
 * its own catch block.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

export function failWrite(resource: string, error: SupabaseErrorShape): never {
  if (isSessionError(error)) {
    throw new SessionExpiredError();
  }

  throw new Error(`Failed to ${resource}: ${error.message}`);
}
