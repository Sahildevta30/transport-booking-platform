"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary (app/error.tsx). Catches unexpected errors thrown
 * during rendering anywhere under the root layout and shows a safe,
 * generic message — never the raw error/stack trace, which could leak
 * internal details. The actual error is logged server-side only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side/log-only. Never render `error.message` directly to
    // the user — it may contain internal details.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to the
        homepage.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
