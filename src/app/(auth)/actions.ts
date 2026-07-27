"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import {
  loginSchema,
  signupSchema,
  type AuthFieldErrors,
} from "@/lib/validation/auth";
import type { AuthFormState } from "./form-state";

function invalid(
  email: string,
  fieldErrors: AuthFieldErrors,
  message: string | null = null,
): AuthFormState {
  return { status: "error", message, fieldErrors, email };
}

export async function login(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = loginSchema.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return invalid(email, z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return invalid(email, {}, describeSignInError(error.message));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signupSchema.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return invalid(email, z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    console.error("signup failed", error);
    return invalid(
      email,
      {},
      "We couldn't create that account. Please try again.",
    );
  }

  // No session means email confirmation is switched on. Supabase also returns
  // success with no session for an address that is already registered, so
  // showing the same screen either way is what stops signup confirming who
  // does and does not have an account.
  if (!data.session) {
    return { status: "check-email", message: null, fieldErrors: {}, email };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/callback` },
  });

  if (error || !data.url) {
    console.error("Google OAuth start failed", error);
    redirect(`/login?error=${AUTH_ERROR_CODES.oauthFailed}`);
  }

  redirect(data.url);
}

// Supabase returns one message for a wrong password and for an address that
// has no account, which is what keeps this form from being an enumeration
// oracle. Preserve that when rewording.
function describeSignInError(raw: string): string {
  if (/invalid login credentials/i.test(raw)) {
    return "That email and password don't match an account.";
  }
  if (/email not confirmed/i.test(raw)) {
    return "Confirm your email first. Check your inbox for the link.";
  }
  return "We couldn't sign you in. Please try again.";
}

function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    // Failing loudly beats redirecting the user to "undefined/callback".
    throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  }
  return url.replace(/\/+$/, "");
}
