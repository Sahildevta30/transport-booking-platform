import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vehicle types" };

export default async function VehicleTypesPage() {
  const supabase = await createClient();
  const { data: types, error } = await supabase.from("vehicle_types").select("id,name,booking_mode,created_at").order("name");
  return <div className="space-y-6"><div><Link href="/admin/vehicles" className="text-sm text-muted-foreground hover:text-foreground">← Fleet</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Vehicle types</h1><p className="mt-2 text-sm text-muted-foreground">Booking capabilities configured for each fleet category.</p></div>{error ? <p className="rounded-lg border p-5 text-sm text-destructive">Vehicle types could not be loaded.</p> : <div className="grid gap-4 sm:grid-cols-2">{types?.map((type) => <article key={type.id} className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{type.name}</h2><p className="mt-2 text-sm text-muted-foreground">{type.booking_mode.replaceAll("_", " ")}</p></article>)}</div>}</div>;
}
