import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { seatBatchSchema, vehicleSchema } from "@/lib/validation/fleet";

export const metadata: Metadata = { title: "Vehicle details" };

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: vehicle }, { data: types }, { data: seats }] = await Promise.all([
    supabase.from("vehicles").select("id,organization_id,vehicle_type_id,label,registration_number,seat_capacity,status").eq("id", id).maybeSingle(),
    supabase.from("vehicle_types").select("id,name,booking_mode").order("name"),
    supabase.from("vehicle_seats").select("id,seat_number,seat_type").eq("vehicle_id", id).order("seat_number"),
  ]);
  if (!vehicle) notFound();

  async function updateVehicle(formData: FormData) { "use server"; const parsed = vehicleSchema.safeParse({ organizationId: formData.get("organization_id"), vehicleTypeId: formData.get("vehicle_type_id"), label: formData.get("label"), registrationNumber: formData.get("registration_number"), seatCapacity: formData.get("seat_capacity") ?? "", status: formData.get("status") }); if (!parsed.success) redirect(`/admin/vehicles/${id}?error=invalid`); const client = await createClient(); const v = parsed.data; const { error } = await client.from("vehicles").update({ vehicle_type_id: v.vehicleTypeId, label: v.label, registration_number: v.registrationNumber, seat_capacity: v.seatCapacity, status: v.status }).eq("id", id).eq("organization_id", v.organizationId); if (error) redirect(`/admin/vehicles/${id}?error=save`); redirect("/admin/vehicles"); }
  async function addSeats(formData: FormData) { "use server"; const parsed = seatBatchSchema.safeParse({ vehicleId: id, prefix: formData.get("prefix"), count: formData.get("count"), seatType: formData.get("seat_type") }); if (!parsed.success) redirect(`/admin/vehicles/${id}?error=seats`); const client = await createClient(); const s = parsed.data; const rows = Array.from({ length: s.count }, (_, index) => ({ vehicle_id: id, seat_number: `${s.prefix.toUpperCase()}${index + 1}`, seat_type: s.seatType || "standard" })); const { error } = await client.from("vehicle_seats").upsert(rows, { onConflict: "vehicle_id,seat_number", ignoreDuplicates: true }); if (error) redirect(`/admin/vehicles/${id}?error=seats`); redirect(`/admin/vehicles/${id}`); }

  return <div className="mx-auto max-w-4xl space-y-7"><div><Link href="/admin/vehicles" className="text-sm text-muted-foreground hover:text-foreground">← Fleet</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">{vehicle.label}</h1><p className="mt-1 font-mono text-sm text-muted-foreground">{vehicle.registration_number}</p></div><div className="grid gap-6 lg:grid-cols-2"><form action={updateVehicle} className="space-y-4 rounded-xl border bg-card p-6"><h2 className="font-semibold">Vehicle details</h2><input type="hidden" name="organization_id" value={vehicle.organization_id} /><Field label="Type"><select name="vehicle_type_id" defaultValue={vehicle.vehicle_type_id} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm">{types?.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></Field><Field label="Label"><Input name="label" defaultValue={vehicle.label} required /></Field><Field label="Registration"><Input name="registration_number" defaultValue={vehicle.registration_number} required /></Field><Field label="Capacity"><Input name="seat_capacity" type="number" min={1} max={200} defaultValue={vehicle.seat_capacity ?? ""} /></Field><Field label="Status"><select name="status" defaultValue={vehicle.status} className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></Field><Button type="submit">Save changes</Button></form><div className="space-y-4 rounded-xl border bg-card p-6"><div><h2 className="font-semibold">Seat layout</h2><p className="text-sm text-muted-foreground">{seats?.length ?? 0} seats configured</p></div><form action={addSeats} className="grid grid-cols-3 gap-3"><Input name="prefix" placeholder="Prefix A" required /><Input name="count" type="number" min={1} max={100} placeholder="Count" required /><Input name="seat_type" placeholder="standard" /><Button type="submit" className="col-span-3">Generate seats</Button></form><div className="flex flex-wrap gap-2">{seats?.map((seat) => <span key={seat.id} className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs font-medium" title={seat.seat_type ?? undefined}>{seat.seat_number}</span>)}</div></div></div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
