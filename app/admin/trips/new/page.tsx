import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/admin/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { tripSchema } from "@/lib/validation/routes";

export const metadata: Metadata = { title: "Schedule trip" };

export default async function NewTripPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: memberships } = user
    ? await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
    : { data: [] };
  const orgIds = (memberships ?? []).map((m) => m.organization_id);
  const [{ data: routes }, { data: vehicles }] = orgIds.length
    ? await Promise.all([
        supabase
          .from("routes")
          .select("id,name,organization_id")
          .in("organization_id", orgIds)
          .order("name"),
        supabase
          .from("vehicles")
          .select("id,label,registration_number,status,organization_id")
          .in("organization_id", orgIds)
          .eq("status", "active")
          .order("label"),
      ])
    : [{ data: [] }, { data: [] }];
  async function createTrip(formData: FormData) {
    "use server";
    const parsed = tripSchema.safeParse({
      routeId: formData.get("route_id"),
      vehicleId: formData.get("vehicle_id"),
      departureTime: formData.get("departure_time"),
      arrivalTime: formData.get("arrival_time"),
      basePrice: formData.get("base_price"),
      status: formData.get("status"),
    });
    if (!parsed.success) redirect("/admin/trips/new?error=invalid");
    const client = await createClient();
    const v = parsed.data;
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login?next=/admin/trips/new");
    const { data: vehicle } = await client
      .from("vehicles")
      .select("organization_id")
      .eq("id", v.vehicleId)
      .maybeSingle();
    const { data: route } = await client
      .from("routes")
      .select("organization_id")
      .eq("id", v.routeId)
      .maybeSingle();
    if (!vehicle || !route || vehicle.organization_id !== route.organization_id)
      redirect("/admin/trips/new?error=forbidden");
    const { data: membership } = await client
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", vehicle.organization_id)
      .eq("user_id", user.id)
      .in("role", ["OWNER", "ADMIN"])
      .maybeSingle();
    if (!membership) redirect("/admin/trips/new?error=forbidden");
    const departure = new Date(v.departureTime).toISOString();
    const arrival = new Date(v.arrivalTime).toISOString();
    const { data: existing } = await client
      .from("trips")
      .select("id,departure_at,arrival_at,status")
      .eq("vehicle_id", v.vehicleId)
      .neq("status", "cancelled");
    const proposedStart = new Date(departure).getTime();
    const proposedEnd = new Date(arrival).getTime();
    const conflict = (existing ?? []).some((t) => {
      const start = new Date(t.departure_at).getTime();
      const end = t.arrival_at
        ? new Date(t.arrival_at).getTime()
        : Number.POSITIVE_INFINITY;
      return start < proposedEnd && end > proposedStart;
    });
    if (conflict) redirect("/admin/trips/new?error=vehicle-conflict");
    const { error } = await client
      .from("trips")
      .insert({
        route_id: v.routeId,
        vehicle_id: v.vehicleId,
        departure_at: departure,
        arrival_at: arrival,
        status: v.status,
        base_price: v.basePrice,
      });
    if (error) redirect("/admin/trips/new?error=save");
    redirect("/admin/trips");
  }
  const ready = Boolean(routes?.length && vehicles?.length);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/trips"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to trips
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Schedule trip
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assign an active vehicle to a route for a specific operating window.
        </p>
      </div>
      {!ready ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          A route and active vehicle are required before scheduling.
        </div>
      ) : null}
      <form
        action={createTrip}
        className="space-y-5 rounded-2xl border bg-card p-6 shadow-card"
      >
        <Field label="Route">
          <Select
            name="route_id"
            options={routes?.map((x) => [x.id, x.name]) ?? []}
          />
        </Field>
        <Field label="Vehicle">
          <Select
            name="vehicle_id"
            options={
              vehicles?.map((x) => [
                x.id,
                `${x.label} — ${x.registration_number}`,
              ]) ?? []
            }
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Departure">
            <Input name="departure_time" type="datetime-local" required />
          </Field>
          <Field label="Arrival">
            <Input name="arrival_time" type="datetime-local" required />
          </Field>
        </div>
        <Field label="Base price">
          <Input name="base_price" type="number" min="0" step="0.01" required />
        </Field>
        <Field label="Initial status">
          <select
            name="status"
            defaultValue="scheduled"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="scheduled">scheduled</option>
            <option value="in_progress">in progress</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </Field>
        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/trips">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!ready}>
            Schedule trip
          </Button>
        </div>
      </form>
    </div>
  );
}function Select({
  name,
  options,
}: {
  name: string;
  options: [string, string][];
}) {
  return (
    <select
      name={name}
      required
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">Select</option>
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
  );
}
