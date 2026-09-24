import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Route as RouteIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/booking/booking-form";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Book trip" };
type Props = { searchParams: Promise<{ trip?: string; passengers?: string }> };

function formatDuration(departureAt: string, arrivalAt: string | null): string | null {
  if (!arrivalAt) return null;
  const ms = new Date(arrivalAt).getTime() - new Date(departureAt).getTime();
  if (!(ms > 0)) return null;
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export default async function BookingPage({ searchParams }: Props) {
  const { trip: tripId, passengers: raw } = await searchParams;
  if (!tripId) notFound();
  const count = Math.min(50, Math.max(1, Number(raw) || 1));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    redirect(
      `/login?next=${encodeURIComponent(`/booking?trip=${tripId}&passengers=${count}`)}`,
    );
  const { data: trip } = await supabase
    .from("trips")
    .select("id,route_id,vehicle_id,departure_at,arrival_at,status,base_price")
    .eq("id", tripId)
    .maybeSingle();
  if (
    !trip ||
    trip.status !== "scheduled" ||
    new Date(trip.departure_at) <= new Date()
  )
    notFound();
  const [{ data: route }, { data: vehicle }] = await Promise.all([
    supabase
      .from("routes")
      .select("id,name,origin_location_id,destination_location_id,distance_km")
      .eq("id", trip.route_id)
      .maybeSingle(),
    supabase
      .from("vehicles")
      .select("id,label,registration_number,vehicle_type_id,status,seat_capacity")
      .eq("id", trip.vehicle_id)
      .maybeSingle(),
  ]);
  if (!route || !vehicle || vehicle.status !== "active") notFound();
  const [
    { data: vt },
    { data: seats },
    { data: locations },
    { data: availability },
  ] = await Promise.all([
    supabase
      .from("vehicle_types")
      .select("name,booking_mode")
      .eq("id", vehicle.vehicle_type_id)
      .single(),
    supabase
      .from("vehicle_seats")
      .select("id,seat_number,seat_type")
      .eq("vehicle_id", vehicle.id)
      .order("seat_number"),
    supabase
      .from("locations")
      .select("id,name")
      .in("id", [route.origin_location_id, route.destination_location_id]),
    supabase.rpc("trip_seat_availability", { p_trip_id: trip.id }),
  ]);
  if (!vt) notFound();
  const unavailableSeatIds = (availability ?? [])
    .filter((x) => x.availability !== "AVAILABLE")
    .map((x) => x.seat_id);
  const names = new Map((locations ?? []).map((l) => [l.id, l.name]));
  const origin = names.get(route.origin_location_id) ?? "Origin";
  const destination = names.get(route.destination_location_id) ?? "Destination";
  const duration = formatDuration(trip.departure_at, trip.arrival_at);
  const seatCapable = vt.booking_mode === "SEAT_BOOKING" || vt.booking_mode === "BOTH";
  const fullVehicleCapable =
    vt.booking_mode === "FULL_VEHICLE_BOOKING" || vt.booking_mode === "BOTH";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:space-y-8 sm:px-6 sm:py-12">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href="/search">
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </Link>
      </Button>

      {/* Trip summary — the decision surface between search and booking */}
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-card">
        <div className="bg-gradient-hero px-6 py-7 text-white sm:px-8 sm:py-9">
          {route.name ? (
            <p className="text-xs font-black uppercase tracking-[.18em] text-white/70">
              {route.name}
            </p>
          ) : null}
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            {origin} <span aria-hidden>→</span> {destination}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/85">
            <span>
              {new Date(trip.departure_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                timeZoneName: "short",
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {duration ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {duration}
              </span>
            ) : null}
            {route.distance_km ? (
              <span className="flex items-center gap-1">
                <RouteIcon className="h-3.5 w-3.5" aria-hidden />
                ~{route.distance_km} km
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted">
              <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <div className="text-sm">
              <p className="font-bold">
                {vehicle.label} · {vehicle.registration_number}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {vt.name}
                {vehicle.seat_capacity ? ` · up to ${vehicle.seat_capacity} seats` : ""}
              </p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {seatCapable ? (
                  <span className="rounded-full bg-mode-seat/10 px-2 py-0.5 text-xs font-bold text-mode-seat">
                    Seat booking
                  </span>
                ) : null}
                {fullVehicleCapable ? (
                  <span className="rounded-full bg-mode-full-vehicle/10 px-2 py-0.5 text-xs font-bold text-mode-full-vehicle">
                    Full vehicle
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 sm:justify-end sm:text-right">
            <div className="text-sm sm:order-2">
              <p className="text-xs text-muted-foreground">
                {seatCapable ? "From, per seat" : "Full vehicle"}
              </p>
              <p className="text-3xl font-black">₹{Number(trip.base_price).toFixed(0)}</p>
              <Link
                href="/cancellation-policy"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Free cancellation until departure
              </Link>
            </div>
          </div>
        </div>
      </div>

      <BookingForm
        tripId={trip.id}
        seats={seats ?? []}
        unavailableSeatIds={unavailableSeatIds}
        passengerCount={count}
        basePrice={Number(trip.base_price)}
        bookingMode={vt.booking_mode}
      />
    </div>
  );
}
