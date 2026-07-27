import Link from "next/link";
import { authErrorMessage } from "@/lib/auth-errors";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const oauthError = authErrorMessage(error);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl">Start your journal</h1>
        <p className="text-muted mt-1 text-sm">
          Private by default. Only you ever see your entries.
        </p>
      </div>

      {oauthError && (
        <p role="alert" className="text-status-error text-sm">
          {oauthError}
        </p>
      )}

      <SignupForm />

      <AuthDivider />

      <GoogleButton />

      <p className="text-muted text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-ink font-medium underline underline-offset-2"
        >
          Log in
        </Link>
      </p>
    </main>
  );
}
