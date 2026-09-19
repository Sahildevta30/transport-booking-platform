"use client";

import { useState, type ReactNode } from "react";
import { Bus, Car } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Only "Route" is backed by anything real: routes/trips/bookings all
 * assume a fixed point-to-point departure. There is no rental concept
 * anywhere in the schema — no pickup location, no separate return
 * date/time, no per-day rate (see docs/design-system.md, section 1).
 *
 * Rental is still given a real tab, not hidden, so the information
 * architecture is ready the day the backend supports it — but it renders
 * as an honest "coming soon" panel, never a form that submits to nowhere.
 * This is a deliberate product-scope decision, not an oversight: adding a
 * rental booking model (schema + RPCs + RLS) is real backend work that
 * has not happened yet.
 */
export function BookingModeTabs({ routePanel }: { routePanel: ReactNode }) {
  const [mode, setMode] = useState<"route" | "rental">("route");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Booking type"
        className="inline-flex gap-1 rounded-full bg-muted p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "route"}
          onClick={() => setMode("route")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            mode === "route"
              ? "bg-background text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Bus className="h-4 w-4" aria-hidden />
          Outstation / Route
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "rental"}
          onClick={() => setMode("rental")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            mode === "rental"
              ? "bg-background text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Car className="h-4 w-4" aria-hidden />
          Rental
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            Soon
          </span>
        </button>
      </div>

      <div className="mt-4" role="tabpanel">
        {mode === "route" ? (
          routePanel
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <p className="font-bold">Self-drive rentals are coming soon.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pickup-and-return rentals aren&apos;t live on TransitBook yet —
              every trip today is a scheduled seat or full-vehicle booking on
              a fixed route. Search outstation rides instead.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
