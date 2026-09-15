import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** What ships in a later phase, shown as a small note — never fake data. */
  note?: string;
}

/**
 * Standard "not yet implemented" shell used across Phase 1 route stubs.
 * Establishes the empty-state visual language (see docs/architecture/
 * frontend-architecture.md) without ever rendering fabricated content.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
  note,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      {Icon ? <Icon className="h-10 w-10 text-muted-foreground" /> : null}
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {note ? (
        <p className="rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}
