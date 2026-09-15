"use client";

import { useEffect } from "react";

/**
 * Only triggers if app/layout.tsx itself throws — Next.js requires this
 * file to render its own <html>/<body> since the root layout is gone at
 * that point. Kept intentionally minimal and dependency-free (no
 * Tailwind classes even, since globals.css may not have loaded).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Please try again.</p>
        <button onClick={() => reset()} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
