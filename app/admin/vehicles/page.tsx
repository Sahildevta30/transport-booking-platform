import type { Metadata } from "next";
import Link from "next/link";
import { Bus, Plus, UsersRound, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fleet" };

// Real vehicle statuses only (active | maintenance | inactive) -- same
// coloring convention as booking status badges elsewhere in the admin
// and customer areas, so color always means the same thing.
const STATUS_STYLE: Record<string, string> = {
  active: "bg-success/10 text-success",
  maintenance: "bg-warning/10 text-warning",
  inactive: "bg-muted-foreground/10 text-muted-foreground",
};

export default async function VehiclesPage() {
  const supabase = await createClient();
  const [{ data: vehicles, error }, { data: vehicleTypes }] = await Promise.all(
    [
      supabase
        .from("vehicles")
        .select(
          "id,label,registration_number,seat_capacity,status,vehicle_type_id,created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_types")
        .select("id,name,booking_mode")
        .order("name"),
    ],
  );

  const types = new Map((vehicleTypes ?? []).map((type) => [type.id, type]));
  const active = (vehicles ?? []).filter(
    (vehicle) => vehicle.status === "active",
  ).length;
  const maintenance = (vehicles ?? []).filter(
    (vehicle) => vehicle.status === "maintenance",
  ).length;
  const seats = (vehicles ?? []).reduce(
    (total, vehicle) => total + (vehicle.seat_capacity ?? 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Fleet management</p>
          <h1 className="text-3xl font-semibold tracking-tight">Vehicles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage registered vehicles, capacity and operational status.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add vehicle
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric icon={Bus} label="Active vehicles" value={active} />
        <Metric icon={Wrench} label="In maintenance" value={maintenance} />
        <Metric icon={UsersRound} label="Configured capacity" value={seats} />
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Fleet inventory</h2>
        </div>
        {error ? (
          <p className="p-5 text-sm text-destructive">
            Fleet data could not be loaded. Please try again.
          </p>
        ) : !vehicles?.length ? (
          <div className="p-10 text-center">
            <Bus className="mx-auto h-9 w-9 text-muted-foreground" />
            <h3 className="mt-4 font-medium">No vehicles yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the first vehicle to start building the fleet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Registration</th>
                  <th className="px-5 py-3 font-medium">Capacity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-5 py-4 font-medium">{vehicle.label}</td>
                    <td className="px-5 py-4">
                      {types.get(vehicle.vehicle_type_id)?.name ?? "—"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {vehicle.registration_number}
                    </td>
                    <td className="px-5 py-4">
                      {vehicle.seat_capacity ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[vehicle.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bus;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-card p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
