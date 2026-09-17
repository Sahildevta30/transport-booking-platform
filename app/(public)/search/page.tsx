import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Search Trips" };

type Props = { searchParams: Promise<{ from?: string; to?: string; date?: string; passengers?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const from = params.from?.trim() ?? "";
  const to = params.to?.trim() ?? "";
  const date = params.date ?? "";
  const rawPassengers = Number(params.passengers);
  const passengers = Number.isInteger(rawPassengers) ? Math.min(50, Math.max(1, rawPassengers)) : 1;
  const supabase = await createClient();
  const { data: locations } = await supabase.from("locations").select("id,name,city").order("name");
  const findLocation = (q:string) => (locations ?? []).find(l => `${l.name} ${l.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const origin = from ? findLocation(from) : undefined;
  const destination = to ? findLocation(to) : undefined;
  let results: Array<{id:string;route_id:string;vehicle_id:string;departure_at:string;arrival_at:string|null;status:string;base_price:number}> = [];
  if (origin && destination && origin.id !== destination.id) {
    const { data: routes } = await supabase.from("routes").select("id").eq("origin_location_id", origin.id).eq("destination_location_id", destination.id);
    const routeIds = (routes ?? []).map(r => r.id);
    if (routeIds.length) {
      let query = supabase.from("trips").select("id,route_id,vehicle_id,departure_at,arrival_at,status,base_price").in("route_id", routeIds).eq("status", "scheduled").order("departure_at");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const start = `${date}T00:00:00.000Z`;
        const next = new Date(`${date}T00:00:00.000Z`); next.setUTCDate(next.getUTCDate()+1);
        query = query.gte("departure_at", start).lt("departure_at", next.toISOString());
      }
      const { data } = await query; results = data ?? [];
    }
  }
  const vehicleIds = [...new Set(results.map(r=>r.vehicle_id))];
  const { data: vehicles } = vehicleIds.length ? await supabase.from("vehicles").select("id,label,registration_number,seat_capacity,vehicle_type_id").in("id",vehicleIds) : { data: [] };
  const vehicleMap = new Map((vehicles ?? []).map(v=>[v.id,v]));

  return <div className="mx-auto max-w-6xl space-y-8 px-4 py-10"><div><h1 className="text-3xl font-semibold tracking-tight">Search trips</h1><p className="mt-2 text-muted-foreground">Search scheduled transport using live route and trip data.</p></div><form className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[1fr_1fr_180px_120px_auto]"><Input name="from" defaultValue={from} placeholder="From" required /><Input name="to" defaultValue={to} placeholder="To" required /><Input name="date" type="date" defaultValue={date} /><Input name="passengers" type="number" min={1} max={50} defaultValue={passengers} /><Button type="submit">Search</Button></form>{from && to && (!origin || !destination) ? <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">We could not match one of those locations. Try a city or location available in the network.</div> : null}{origin && destination && origin.id === destination.id ? <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Origin and destination must be different.</div> : null}{origin && destination && origin.id !== destination.id && !results.length ? <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">No trips found</p><p className="mt-1 text-sm text-muted-foreground">Try another date or route. Availability is never fabricated.</p></div> : null}<div className="grid gap-4">{results.map(trip=>{const vehicle=vehicleMap.get(trip.vehicle_id); return <article key={trip.id} className="rounded-xl border bg-card p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{origin?.name} → {destination?.name}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(trip.departure_at).toLocaleString()}{trip.arrival_at ? ` — ${new Date(trip.arrival_at).toLocaleString()}` : ""}</p><p className="mt-2 text-sm">{vehicle ? `${vehicle.label} · ${vehicle.registration_number}` : "Assigned vehicle"}{vehicle?.seat_capacity ? ` · ${vehicle.seat_capacity} seats` : ""} · From ₹{Number(trip.base_price).toFixed(2)}</p></div><Button asChild><Link href={`/booking?trip=${trip.id}&passengers=${passengers}`}>View trip</Link></Button></div></article>})}</div></div>;
}
