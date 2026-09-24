import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Field } from "@/components/admin/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Edit vehicle" };
export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: vehicle } = await supabase.from("vehicles").select("id,organization_id,vehicle_type_id,label,registration_number,seat_capacity,status").eq("id", id).maybeSingle();
  if (!vehicle) notFound();
  const { data: vehicleTypes } = await supabase.from("vehicle_types").select("id,name,booking_mode").order("name");
  async function updateVehicle(formData: FormData) {
    "use server";
    const client = await createClient();
    const { data: current } = await client.from("vehicles").select("organization_id").eq("id", id).maybeSingle();
    if (!current) notFound();
    const { data: { user } } = await client.auth.getUser();
    if (!user) redirect(`/login?next=/admin/vehicles/${id}/edit`);
    const { data: membership } = await client.from("organization_memberships").select("role").eq("organization_id", current.organization_id).eq("user_id", user.id).in("role", ["OWNER", "ADMIN"]).maybeSingle();
    if (!membership) redirect("/admin/vehicles?error=forbidden");
    const vehicleTypeId=String(formData.get("vehicle_type_id")??""); const label=String(formData.get("label")??"").trim(); const registrationNumber=String(formData.get("registration_number")??"").trim().toUpperCase(); const capacityValue=String(formData.get("seat_capacity")??"").trim(); const seatCapacity=capacityValue?Number(capacityValue):null; const status=String(formData.get("status")??"active") as "active"|"maintenance"|"inactive";
    const { data: type } = await client.from("vehicle_types").select("name").eq("id",vehicleTypeId).maybeSingle();
    if(!type||!label||!registrationNumber||!(["active","maintenance","inactive"] as string[]).includes(status)||(seatCapacity!==null&&(!Number.isInteger(seatCapacity)||seatCapacity<1||seatCapacity>200))||(["Bike","Scooty"].includes(type.name)&&seatCapacity!==2)) redirect(`/admin/vehicles/${id}/edit?error=invalid`);
    const { error }=await client.from("vehicles").update({vehicle_type_id:vehicleTypeId,label,registration_number:registrationNumber,seat_capacity:seatCapacity,status}).eq("id",id).eq("organization_id",current.organization_id);
    if(error) redirect(`/admin/vehicles/${id}/edit?error=save`); redirect("/admin/vehicles");
  }
  return <div className="mx-auto max-w-2xl space-y-6"><div><Link href="/admin/vehicles" className="text-sm text-muted-foreground hover:text-foreground">← Back to vehicles</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Edit vehicle</h1><p className="mt-2 text-sm text-muted-foreground">Update fleet details and operational status.</p></div><form action={updateVehicle} className="space-y-5 rounded-2xl border bg-card p-6 shadow-card"><Field label="Vehicle type"><select name="vehicle_type_id" required defaultValue={vehicle.vehicle_type_id} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{vehicleTypes?.map(type=><option key={type.id} value={type.id}>{type.name} — {type.booking_mode.replaceAll("_"," ")}</option>)}</select></Field><Field label="Vehicle name / label"><Input name="label" required maxLength={120} defaultValue={vehicle.label}/></Field><Field label="Registration number"><Input name="registration_number" required maxLength={40} defaultValue={vehicle.registration_number}/></Field><Field label="Seat capacity"><Input name="seat_capacity" type="number" min={1} max={200} inputMode="numeric" defaultValue={vehicle.seat_capacity??""}/><p className="mt-1 text-xs text-muted-foreground">Bike and Scooty capacity must be 2.</p></Field><Field label="Status"><select name="status" defaultValue={vehicle.status} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive (unavailable for new trips)</option></select><p className="mt-1 text-xs text-muted-foreground">Inactive vehicles remain in existing trip and booking records.</p></Field><div className="flex justify-end gap-3 pt-2"><Button asChild variant="outline"><Link href="/admin/vehicles">Cancel</Link></Button><Button type="submit">Save changes</Button></div></form></div>;
}
