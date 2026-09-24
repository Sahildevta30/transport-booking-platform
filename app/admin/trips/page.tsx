import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Trips" };

// Real trip statuses only (scheduled | in_progress | completed |
// cancelled) -- same coloring convention as bookings/vehicles elsewhere.
const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted-foreground/10 text-muted-foreground",
};

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from("trips")
    .select("id,route_id,vehicle_id,departure_at,arrival_at,status,base_price")
    .order("departure_at", { ascending: false });
  const [{ data: routes }, { data: vehicles }] = await Promise.all([
    supabase.from("routes").select("id,name"),
    supabase.from("vehicles").select("id,label,registration_number"),
  ]);
  const routeMap = new Map((routes ?? []).map((item) => [item.id, item.name]));
  const vehicleMap = new Map((vehicles ?? []).map((item) => [item.id, item]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Trips</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Schedule vehicles on routes and monitor operational trip status.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/trips/new">Schedule trip</Link>
        </Button>
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/30 p-5 text-sm text-destructive">
          Trips could not be loaded.
        </div>
      ) : null}
      {!error && !trips?.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">No scheduled trips</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule a vehicle against a route to start operations.
          </p>
          <Button asChild variant="outline" className="mt-4"><Link href="/admin/routes">Set up routes</Link></Button>
        </div>
      ) : null}
      {trips?.length ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3">Route</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Departure</th>
                  <th className="px-4 py-3">Arrival</th>
                  <th className="px-4 py-3">Base price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const vehicle = vehicleMap.get(trip.vehicle_id);
                  return (
                    <tr key={trip.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">
                        {routeMap.get(trip.route_id) ?? "Unknown route"}
                      </td>
                      <td className="px-4 py-3">
                        {vehicle
                          ? `${vehicle.label} · ${vehicle.registration_number}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(trip.departure_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeZoneName: "short" })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {trip.arrival_at
                          ? new Date(trip.arrival_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeZoneName: "short" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        ₹{Number(trip.base_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[trip.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {trip.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
