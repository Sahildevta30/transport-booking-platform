import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/field";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add vehicle" };

export default async function NewVehiclePage() {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "");
  const organizationIds = (memberships ?? []).map(
    (membership) => membership.organization_id,
  );
  const { data: organizations } = organizationIds.length
    ? await supabase
        .from("organizations")
        .select("id,name")
        .in("id", organizationIds)
        .order("name")
    : { data: [] };
  const { data: vehicleTypes } = await supabase
    .from("vehicle_types")
    .select("id,name,booking_mode")
    .order("name");

  async function createVehicle(formData: FormData) {
    "use server";
    const client = await createClient();
    const organizationId = String(formData.get("organization_id") ?? "");
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login?next=/admin/vehicles/new");
    const { data: membership } = await client
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .in("role", ["OWNER", "ADMIN"])
      .maybeSingle();
    if (!membership) redirect("/admin/vehicles/new?error=forbidden");
    const vehicleTypeId = String(formData.get("vehicle_type_id") ?? "");
    const registrationNumber = String(formData.get("registration_number") ?? "")
      .trim()
      .toUpperCase();
    const label = String(formData.get("label") ?? "").trim();
    const capacityValue = String(formData.get("seat_capacity") ?? "").trim();
    const status = String(formData.get("status") ?? "active") as
      "active" | "maintenance" | "inactive";
    const seatCapacity = capacityValue ? Number(capacityValue) : null;

    if (
      !organizationId ||
      !vehicleTypeId ||
      !registrationNumber ||
      !label ||
      (seatCapacity !== null &&
        (!Number.isInteger(seatCapacity) || seatCapacity < 1))
    )
      redirect("/admin/vehicles/new?error=invalid");

    const { error } = await client
      .from("vehicles")
      .insert({
        organization_id: organizationId,
        vehicle_type_id: vehicleTypeId,
        registration_number: registrationNumber,
        label,
        seat_capacity: seatCapacity,
        status,
      });
    if (error) redirect("/admin/vehicles/new?error=save");
    redirect("/admin/vehicles");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/vehicles"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to vehicles
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Add vehicle
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Register a vehicle against an organization and booking type.
        </p>
      </div>
      {!organizations?.length ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          No organization is available for your account yet. Create/bootstrap an
          organization before registering fleet vehicles.
        </div>
      ) : null}
      <form
        action={createVehicle}
        className="space-y-5 rounded-2xl border bg-card p-6 shadow-card"
      >
        <Field label="Organization">
          <select
            name="organization_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select organization</option>
            {organizations?.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle type">
          <select
            name="vehicle_type_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select type</option>
            {vehicleTypes?.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} — {type.booking_mode.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vehicle name / label">
          <Input
            name="label"
            required
            maxLength={120}
            placeholder="e.g. City Express 01"
          />
        </Field>
        <Field label="Registration number">
          <Input
            name="registration_number"
            required
            maxLength={40}
            placeholder="e.g. OD14AB1234"
          />
        </Field>
        <Field label="Seat capacity">
          <Input
            name="seat_capacity"
            type="number"
            min={1}
            max={200}
            inputMode="numeric"
            placeholder="Optional for full-vehicle bookings"
          />
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue="active"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline">
            <Link href="/admin/vehicles">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!organizations?.length}>
            Save vehicle
          </Button>
        </div>
      </form>
    </div>
  );
}
