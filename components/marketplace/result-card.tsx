import Link from "next/link";
import { ArrowRight, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TripResult = {
  id: string;
  departureAt: string;
  arrivalAt: string | null;
  basePrice: number;
  vehicleLabel: string | null;
  seatCapacity: number | null;
  vehicleTypeName: string | null;
  bookingMode: "SEAT_BOOKING" | "FULL_VEHICLE_BOOKING" | "BOTH" | null;
};

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

/**
 * Every field here is a real column from trips/vehicles/vehicle_types —
 * nothing is invented. Duration is shown only when arrival_at is actually
 * set (many trips have it null, and a guessed duration would be a
 * fabricated number on a page that must not fabricate anything). Seat
 * capacity is the vehicle's total capacity, not a live "seats left" count
 * — computing real remaining availability requires the authenticated
 * trip_seat_availability() RPC, which anonymous visitors on this page
 * cannot call; that live number is correctly shown one step later, on the
 * booking page, once the visitor is signed in.
 */
export function ResultCard({
  trip,
  operatorName,
  origin,
  destination,
  passengers,
}: {
  trip: TripResult;
  operatorName: string | null;
  origin: string;
  destination: string;
  passengers: number;
}) {
  const duration = formatDuration(trip.departureAt, trip.arrivalAt);
  const seatCapable = trip.bookingMode === "SEAT_BOOKING" || trip.bookingMode === "BOTH";
  const fullVehicleCapable =
    trip.bookingMode === "FULL_VEHICLE_BOOKING" || trip.bookingMode === "BOTH";

  return (
    <article className="rounded-[1.5rem] border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-lg font-black tracking-tight sm:text-xl">
              {origin} <ArrowRight className="mx-0.5 inline h-4 w-4 text-muted-foreground" /> {destination}
            </p>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              {new Date(trip.departureAt).toLocaleString("en-IN", {
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
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {operatorName ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Operated by {operatorName}</span> : null}
            {trip.vehicleLabel ? (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {trip.vehicleLabel}
                {trip.vehicleTypeName ? ` · ${trip.vehicleTypeName}` : ""}
              </span>
            ) : null}
            {seatCapable ? (
              <span className="flex items-center gap-1 rounded-full bg-mode-seat/10 px-2.5 py-1 text-xs font-bold text-mode-seat">
                <Users className="h-3 w-3" aria-hidden />
                Seat booking
                {trip.seatCapacity ? ` · up to ${trip.seatCapacity} seats` : ""}
              </span>
            ) : null}
            {fullVehicleCapable ? (
              <span className="rounded-full bg-mode-full-vehicle/10 px-2.5 py-1 text-xs font-bold text-mode-full-vehicle">
                Full vehicle
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 border-t border-border pt-4 sm:items-end sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0">
          <div>
            <p className="text-xs text-muted-foreground">
              {seatCapable ? "From, per seat" : "Full vehicle"}
            </p>
            <p className="text-2xl font-black">₹{Number(trip.basePrice).toFixed(0)}</p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/booking?trip=${trip.id}&passengers=${passengers}`}>
              View &amp; book
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
