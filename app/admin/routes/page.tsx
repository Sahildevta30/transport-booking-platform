import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Routes" };

export default async function RoutesPage() {
  const supabase = await createClient();
  const { data: routes, error } = await supabase.from("routes").select("id,name,origin_location_id,destination_location_id,distance_km,estimated_duration_minutes").order("name");
  const { data: locations } = await supabase.from("locations").select("id,name,city");
  const locationMap = new Map((locations ?? []).map((item) => [item.id, item]));

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight">Routes</h1><p className="mt-2 text-sm text-muted-foreground">Manage origin, destination, distance and scheduled corridor data.</p></div><Button asChild><Link href="/admin/routes/new">Add route</Link></Button></div>
    {error ? <div className="rounded-lg border border-destructive/30 p-5 text-sm text-destructive">Routes could not be loaded.</div> : null}
    {!error && !routes?.length ? <div className="rounded-xl border border-dashed p-10 text-center"><p className="font-medium">No routes yet</p><p className="mt-1 text-sm text-muted-foreground">Create the first transport route to begin scheduling trips.</p></div> : null}
    {routes?.length ? <div className="overflow-hidden rounded-xl border bg-card"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left"><tr><th className="px-4 py-3">Route</th><th className="px-4 py-3">Origin</th><th className="px-4 py-3">Destination</th><th className="px-4 py-3">Distance</th><th className="px-4 py-3">Duration</th></tr></thead><tbody>{routes.map((route) => { const origin=locationMap.get(route.origin_location_id); const destination=locationMap.get(route.destination_location_id); return <tr key={route.id} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{route.name}</td><td className="px-4 py-3">{origin ? `${origin.name}${origin.city ? `, ${origin.city}` : ""}` : "—"}</td><td className="px-4 py-3">{destination ? `${destination.name}${destination.city ? `, ${destination.city}` : ""}` : "—"}</td><td className="px-4 py-3">{route.distance_km ? `${route.distance_km} km` : "—"}</td><td className="px-4 py-3">{route.estimated_duration_minutes ? `${route.estimated_duration_minutes} min` : "—"}</td></tr>; })}</tbody></table></div></div> : null}
  </div>;
}
