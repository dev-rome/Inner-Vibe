"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard failed to render", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6 text-center">
      <h1 className="text-ink text-xl font-medium">
        We could not load your entries
      </h1>
      <p className="text-muted text-sm">
        Nothing has been lost. This is usually a connection problem and trying
        again often works.
      </p>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
