import { Loader2 } from "lucide-react";

/**
 * Shared loading fallback, shown by route-level loading.tsx files while
 * an async Server Component (e.g. a layout awaiting getSessionUser())
 * resolves. `role="status"` + sr-only text announce it to screen readers
 * without visually cluttering the UI.
 */
export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
