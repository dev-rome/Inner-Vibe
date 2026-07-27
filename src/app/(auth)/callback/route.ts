import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import { resolveDestination } from "@/lib/safe-redirect";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;

  // A refused consent screen arrives here as an error parameter, not as a
  // failed exchange, so it has to be handled before looking for a code.
  const providerError = searchParams.get("error");
  if (providerError) {
    return failure(
      requestUrl,
      providerError === "access_denied"
        ? AUTH_ERROR_CODES.oauthCancelled
        : AUTH_ERROR_CODES.oauthFailed,
      searchParams.get("error_description") ?? providerError,
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return failure(requestUrl, AUTH_ERROR_CODES.oauthFailed, "missing code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return failure(requestUrl, AUTH_ERROR_CODES.oauthFailed, error.message);
  }

  return NextResponse.redirect(
    resolveDestination(searchParams.get("next"), requestUrl),
  );
}

function failure(base: URL, code: string, cause: string) {
  console.error(`OAuth callback failed (${code}):`, cause);

  const destination = new URL("/login", base);
  // A code, not the provider's message. Reflecting arbitrary text from the
  // query string onto our own login page is a phishing surface.
  destination.searchParams.set("error", code);

  return NextResponse.redirect(destination);
}
