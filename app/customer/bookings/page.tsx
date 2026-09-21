import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "My Bookings" };

// Status -> a real, existing token, so a status always reads the same
// color everywhere it appears (search results already use mode-seat /
// mode-full-vehicle the same way for booking mode). No status here is
// invented — these are exactly the values bookings.status can hold.
const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  COMPLETED: "bg-primary/10 text-primary",
  CANCELLED: "bg-muted-foreground/10 text-muted-foreground",
  REFUND_PENDING: "bg-warning/10 text-warning",
  REFUNDED: "bg-muted-foreground/10 text-muted-foreground",
};

export default async function CustomerBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/customer/bookings");
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id,trip_id,booking_mode,status,passenger_count,amount,created_at")
    .order("created_at", { ascending: false });

  const rows = bookings ?? [];
  const tripIds = [...new Set(rows.map((b) => b.trip_id))];
  const { data: tripsData } = tripIds.length
    ? await supabase.from("trips").select("id,route_id,departure_at").in("id", tripIds)
    : { data: [] };
  const trips = new Map((tripsData ?? []).map((t) => [t.id, t]));

  const routeIds = [...new Set([...trips.values()].map((t) => t.route_id))];
  const { data: routesData } = routeIds.length
    ? await supabase
        .from("routes")
        .select("id,origin_location_id,destination_location_id")
        .in("id", routeIds)
    : { data: [] };
  const routes = new Map((routesData ?? []).map((r) => [r.id, r]));

  const locationIds = [
    ...new Set([...routes.values()].flatMap((r) => [r.origin_location_id, r.destination_location_id])),
  ];
  const { data: locationsData } = locationIds.length
    ? await supabase.from("locations").select("id,name").in("id", locationIds)
    : { data: [] };
  const locationNames = new Map((locationsData ?? []).map((l) => [l.id, l.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">My Bookings</h1>
        <p className="mt-1.5 text-muted-foreground">
          Everything you booked, all in one place.
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border p-5 text-sm">
          Bookings could not be loaded.
        </p>
      ) : null}
      {!error && !rows.length ? (
        <div className="rounded-[1.75rem] border border-dashed bg-card/60 p-12 text-center">
          <p className="font-medium">No bookings yet</p>
          <Button asChild className="mt-4">
            <Link href="/search">Explore rides</Link>
          </Button>
        </div>
      ) : null}
      <div className="grid gap-4">
        {rows.map((b) => {
          const trip = trips.get(b.trip_id);
          const route = trip ? routes.get(trip.route_id) : undefined;
          const origin = route ? locationNames.get(route.origin_location_id) : undefined;
          const destination = route ? locationNames.get(route.destination_location_id) : undefined;
          return (
            <Link
              key={b.id}
              href={`/customer/bookings/${b.id}`}
              className="block rounded-[1.5rem] border bg-card p-6 shadow-card outline-none transition duration-300 hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black tracking-tight">
                      {origin && destination ? (
                        <>
                          {origin} <ArrowRight className="mx-0.5 inline h-4 w-4 text-muted-foreground" /> {destination}
                        </>
                      ) : (
                        `Booking ${b.id.slice(0, 8).toUpperCase()}`
                      )}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold",
                        STATUS_STYLE[b.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {b.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {trip ? (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        {new Date(trip.departure_at).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : null}
                    <span>{b.booking_mode.replaceAll("_", " ")}</span>
                    <span>
                      {b.passenger_count} passenger{b.passenger_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xl font-black">₹{Number(b.amount).toFixed(0)}</p>
                  <span className="text-sm font-semibold text-primary">View booking →</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
