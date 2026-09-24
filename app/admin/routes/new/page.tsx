import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/field";
import { createClient } from "@/lib/supabase/server";
import { routeSchema } from "@/lib/validation/routes";

export const metadata: Metadata = { title: "Add route" };

export default async function NewRoutePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: formError } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: memberships } = user
    ? await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .in("role", ["OWNER", "ADMIN"])
    : { data: [] };
  const organizationIds = (memberships ?? []).map((m) => m.organization_id);
  const [{ data: organizations }, { data: locations }] = await Promise.all([
    organizationIds.length
      ? supabase
          .from("organizations")
          .select("id,name")
          .in("id", organizationIds)
          .order("name")
      : Promise.resolve({ data: [] }),
    supabase.from("locations").select("id,name,city,state,pincode").order("name"),
  ]);

  async function createRoute(formData: FormData) {
    "use server";
    const parsed = routeSchema.safeParse({
      organizationId: formData.get("organization_id"),
      name: formData.get("name"),
      originLocationId: formData.get("origin_location_id"),
      destinationLocationId: formData.get("destination_location_id"),
      distanceKm: formData.get("distance_km")
        ? formData.get("distance_km")
        : null,
    });
    if (!parsed.success) redirect("/admin/routes/new?error=invalid");
    const client = await createClient();
    const v = parsed.data;
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) redirect("/login?next=/admin/routes/new");
    const { data: membership } = await client
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", v.organizationId)
      .eq("user_id", user.id)
      .in("role", ["OWNER", "ADMIN"])
      .maybeSingle();
    if (!membership) redirect("/admin/routes/new?error=forbidden");
    if (v.originLocationId === v.destinationLocationId)
      redirect("/admin/routes/new?error=invalid");
    const { data: existing, error: lookupError } = await client
      .from("routes")
      .select("id")
      .eq("organization_id", v.organizationId)
      .eq("origin_location_id", v.originLocationId)
      .eq("destination_location_id", v.destinationLocationId)
      .limit(1);
    if (lookupError) redirect("/admin/routes/new?error=save");
    if (existing?.length) redirect("/admin/routes/new?error=duplicate");
    const { error } = await client
      .from("routes")
      .insert({
        organization_id: v.organizationId,
        name: v.name,
        origin_location_id: v.originLocationId,
        destination_location_id: v.destinationLocationId,
        distance_km: v.distanceKm ?? null,
      });
    if (error) redirect("/admin/routes/new?error=save");
    redirect("/admin/routes");
  }

  const ready = Boolean(
    organizations?.length && locations && locations.length >= 2,
  );
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/routes"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to routes
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Add route
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Define a transport corridor between two existing locations.
        </p>
      </div>
      {!ready ? (
        <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          {locations && locations.length < 2 ? <>Add at least two real locations first. <Link className="font-medium text-primary underline" href="/admin/locations">Manage locations</Link></> : "An active partner organization and two locations are required before creating a route."}
        </div>
      ) : null}
      {formError && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{formError === "duplicate" ? "This organization already has a route with these origin and destination stops." : formError === "invalid" ? "Choose two different locations and check the route details." : formError === "forbidden" ? "You are not allowed to create routes for this organization." : "Route could not be saved. Please try again."}</p>}
      <form
        action={createRoute}
        className="space-y-5 rounded-2xl border bg-card p-6 shadow-card"
      >
        <Field label="Organization">
          <select
            name="organization_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select organization</option>
            {organizations?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Route name">
          <Input
            name="name"
            required
            maxLength={120}
            placeholder="Rourkela to Bhubaneswar"
          />
        </Field>
        <Field label="Origin">
          <select
            name="origin_location_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select origin</option>
            {locations?.map((l) => (
              <option key={l.id} value={l.id}>
                {[l.name, l.city, l.state, l.pincode].filter(Boolean).join(" · ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destination">
          <select
            name="destination_location_id"
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select destination</option>
            {locations?.map((l) => (
              <option key={l.id} value={l.id}>
                {[l.name, l.city, l.state, l.pincode].filter(Boolean).join(" · ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Distance (km)">
          <Input name="distance_km" type="number" min="0.1" step="0.1" />
        </Field>
        <div className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/routes">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!ready}>
            Save route
          </Button>
        </div>
      </form>
    </div>
  );
}
