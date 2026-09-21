import { cloneElement, isValidElement, useId, type ReactElement } from "react";

import { Label } from "@/components/ui/label";

/**
 * Every admin create/edit form (vehicles/new, routes/new, trips/new,
 * vehicles/[id]) had its own copy of this wrapper, and all four rendered
 * <Label>{label}</Label> with no htmlFor — the label and its input were
 * never actually associated, so a screen reader announced the input with
 * no name, and clicking the label text did nothing.
 *
 * Fixed once here instead of in four places: a stable id is generated per
 * field and injected onto the single child element (an <Input> or a
 * plain <select>, which is everything these forms ever pass in), unless
 * the caller already supplied its own id, which is left alone.
 */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const generatedId = useId();
  const existingId = isValidElement(children) ? children.props.id : undefined;
  const id = existingId ?? generatedId;
  const field = isValidElement(children) ? cloneElement(children, { id }) : children;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {field}
    </div>
  );
}
