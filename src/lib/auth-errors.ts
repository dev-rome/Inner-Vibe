export const AUTH_ERROR_CODES = {
  oauthFailed: "oauth_failed",
  oauthCancelled: "oauth_cancelled",
  sessionExpired: "session_expired",
} as const;

const MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.oauthFailed]:
    "We couldn't complete that sign-in. Please try again.",
  [AUTH_ERROR_CODES.oauthCancelled]: "Sign-in was cancelled.",
  [AUTH_ERROR_CODES.sessionExpired]:
    "Your session is no longer valid. Please log in again.",
};

/**
 * Redirects carry a short code, never a message.
 *
 * A message in the query string is attacker-controlled text rendered on our
 * own login page, which is a ready-made phishing surface even though React
 * escapes it. Unrecognised codes collapse to the generic line.
 */
export function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "We couldn't sign you in. Please try again.";
}
