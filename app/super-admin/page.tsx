import type { Metadata } from "next";
import {
  Activity,
  Building2,
  Bus,
  Gauge,
  IndianRupee,
  Lock,
  MapPin,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Platform supervision" };

// Same status vocabulary/colors used across the customer and partner
// areas, so a status reads the same everywhere in the product.
const TRIP_STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted-foreground/10 text-muted-foreground",
};
const BOOKING_STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  COMPLETED: "bg-primary/10 text-primary",
  CANCELLED: "bg-muted-foreground/10 text-muted-foreground",
  REFUND_PENDING: "bg-warning/10 text-warning",
  REFUNDED: "bg-muted-foreground/10 text-muted-foreground",
};

type Row = {
  organization_id: string;
  organization_name: string;
  vehicle_id: string;
  vehicle_label: string;
  registration_number: string;
  vehicle_status: string;
  trip_id: string | null;
  trip_status: string | null;
  departure_at: string | null;
  arrival_at: string | null;
  booking_id: string | null;
  customer_id: string | null;
  booking_status: string | null;
  booking_amount: number | null;
  base_price: number | null;
  discount_amount: number | null;
  origin_name: string | null;
  destination_name: string | null;
};
export default async function SuperAdminPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("supervision_overview");
  const rows = (data ?? []) as Row[];
  const orgs = new Set(rows.map((r) => r.organization_id)).size,
    vehicles = new Set(rows.map((r) => r.vehicle_id)).size,
    active = rows.filter((r) => r.trip_status === "in_progress").length,
    bookings = rows.filter((r) => r.booking_id).length;
  // Real, derived from the same fetched rows -- not a separate query, not
  // an invented percentage. "Vehicles with a trip currently in progress,
  // as a share of every distinct vehicle this view can see."
  const utilization = vehicles > 0 ? Math.round((active / vehicles) * 100) : null;
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[1.75rem] border bg-gradient-hero p-7 text-white shadow-elevated sm:p-9">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_85%_15%,white,transparent_35%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            Read-only supervision
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
            See every fleet, trip and booking without touching operations.
          </h1>
          <p className="mt-3 max-w-2xl text-white/80">
            A read-only command view of partner fleets, customer assignments,
            routes, timing, pricing and discounts. Nothing on this page can
            create, edit, or cancel anything — enforced by the database, not
            just this page.
          </p>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric icon={Building2} label="Partners" value={orgs} />
        <Metric icon={Bus} label="Vehicles" value={vehicles} />
        <Metric icon={Activity} label="Trips in progress" value={active} />
        <Metric icon={Ticket} label="Bookings visible" value={bookings} />
        <Metric
          icon={Gauge}
          label="Fleet utilization"
          value={utilization === null ? "—" : `${utilization}%`}
        />
      </div>
      <section className="overflow-hidden rounded-[1.75rem] border bg-card shadow-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Fleet activity</h2>
            <p className="text-sm text-muted-foreground">
              Current and historical marketplace supervision.
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            <Lock className="h-3 w-3" aria-hidden />
            Read only
          </span>
        </div>
        {error ? (
          <p className="p-6 text-sm text-destructive">
            Supervision data could not be loaded.
          </p>
        ) : !rows.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bus className="mx-auto mb-3 h-9 w-9" />
            <p>No fleet activity is available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  {[
                    "Partner / vehicle",
                    "Route",
                    "Trip",
                    "Customer",
                    "Booking",
                    "Base price",
                    "Booked",
                    "Discount",
                  ].map((x) => (
                    <th key={x} className="px-5 py-3 font-medium">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r, i) => (
                  <tr
                    key={(r.booking_id ?? r.trip_id ?? r.vehicle_id) + i}
                    className="hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium">{r.organization_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.vehicle_label} · {r.registration_number}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {r.origin_name ?? "—"} → {r.destination_name ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {r.trip_status ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${TRIP_STATUS_STYLE[r.trip_status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {r.trip_status.replaceAll("_", " ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {r.customer_id ? r.customer_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-5 py-4">
                      {r.booking_status ? (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${BOOKING_STATUS_STYLE[r.booking_status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {r.booking_status.replaceAll("_", " ")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <Money value={r.base_price} />
                    <Money value={r.booking_amount} />
                    <Money value={r.discount_amount} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bus;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="mb-4 w-fit rounded-xl bg-muted p-2.5">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
function Money({ value }: { value: number | null }) {
  return (
    <td className="px-5 py-4">
      <span className="inline-flex items-center">
        <IndianRupee className="h-3 w-3" />
        {value == null ? "—" : Number(value).toFixed(2)}
      </span>
    </td>
  );
}
