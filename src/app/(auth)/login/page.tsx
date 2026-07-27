import Link from "next/link";
import { authErrorMessage } from "@/lib/auth-errors";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Arrives as a code from the OAuth callback and is mapped to copy here, so
  // the query string can never put arbitrary text on this page.
  const oauthError = authErrorMessage(error);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl">Welcome back</h1>
        <p className="text-muted mt-1 text-sm">
          Pick up your journal where you left off.
        </p>
      </div>

      {oauthError && (
        <p role="alert" className="text-status-error text-sm">
          {oauthError}
        </p>
      )}

      <LoginForm />

      <AuthDivider />

      <GoogleButton />

      <p className="text-muted text-center text-sm">
        No account?{" "}
        <Link
          href="/signup"
          className="text-ink font-medium underline underline-offset-2"
        >
          Sign up
        </Link>
      </p>
    </main>
  );
}
