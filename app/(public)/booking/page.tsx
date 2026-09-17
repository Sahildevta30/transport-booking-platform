import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Trip details" };

type Props = { searchParams: Promise<{ trip?: string; passengers?: string }> };

export default async function BookingPage({ searchParams }: Props) {
  const { trip: tripId, passengers: rawPassengers } = await searchParams;
  if (!tripId) notFound();
  const passengers = Math.max(1, Number(rawPassengers) || 1);
  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("id,route_id,vehicle_id,departure_time,arrival_time,status").eq("id", tripId).maybeSingle();
  if (!trip || !["scheduled", "open"].includes(trip.status)) notFound();
  const [{ data: route }, { data: vehicle }] = await Promise.all([
    supabase.from("routes").select("id,name,origin_location_id,destination_location_id,distance_km,estimated_duration_minutes").eq("id", trip.route_id).maybeSingle(),
    supabase.from("vehicles").select("id,label,registration_number,seat_capacity,vehicle_type_id,status").eq("id", trip.vehicle_id).maybeSingle(),
  ]);
  if (!route || !vehicle || vehicle.status !== "active") notFound();
  const locationIds = [route.origin_location_id, route.destination_location_id];
  const { data: locations } = await supabase.from("locations").select("id,name,city,state").in("id", locationIds);
  const locationMap = new Map((locations ?? []).map(location => [location.id, location]));
  const origin = locationMap.get(route.origin_location_id);
  const destination = locationMap.get(route.destination_location_id);

  return <div className="mx-auto max-w-4xl space-y-6 px-4 py-10"><Button variant="ghost" asChild><Link href="/search"><ArrowLeft className="mr-2 h-4 w-4" />Back to search</Link></Button><div><p className="text-sm font-medium text-muted-foreground">Trip details</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{origin?.name ?? "Origin"} → {destination?.name ?? "Destination"}</h1><p className="mt-2 text-muted-foreground">Review the live trip information before continuing to booking.</p></div><div className="grid gap-4 rounded-xl border bg-card p-6 sm:grid-cols-2"><div className="flex gap-3"><CalendarDays className="mt-1 h-5 w-5"/><div><p className="font-medium">Schedule</p><p className="text-sm text-muted-foreground">{new Date(trip.departure_time).toLocaleString()} → {new Date(trip.arrival_time).toLocaleString()}</p></div></div><div className="flex gap-3"><MapPin className="mt-1 h-5 w-5"/><div><p className="font-medium">Route</p><p className="text-sm text-muted-foreground">{route.name}{route.distance_km ? ` · ${route.distance_km} km` : ""}</p></div></div><div><p className="font-medium">Vehicle</p><p className="text-sm text-muted-foreground">{vehicle.label} · {vehicle.registration_number}{vehicle.seat_capacity ? ` · ${vehicle.seat_capacity} seats` : ""}</p></div><div className="flex gap-3"><Users className="mt-1 h-5 w-5"/><div><p className="font-medium">Passengers</p><p className="text-sm text-muted-foreground">{passengers}</p></div></div></div><div className="rounded-xl border border-dashed p-6"><h2 className="font-semibold">Booking handoff ready</h2><p className="mt-2 text-sm text-muted-foreground">This page intentionally does not claim seats or prices yet. Real seat locking, availability and checkout belong to the booking engine so concurrent customers cannot be double-booked.</p><Button className="mt-4" disabled>Continue to seat selection</Button></div></div>;
}
