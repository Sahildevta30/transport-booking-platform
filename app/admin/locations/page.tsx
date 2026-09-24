import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/field";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Locations" };

type Props = { searchParams: Promise<{ error?: string; added?: string }> };

export default async function LocationsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const [{ data: locations, error }, { data: { user } }] = await Promise.all([
    supabase.from("locations").select("id,name,city,state,pincode").order("name"),
    supabase.auth.getUser(),
  ]);
  const { data: membership } = user
    ? await supabase.from("organization_memberships").select("role").eq("user_id", user.id).in("role", ["OWNER", "ADMIN"]).limit(1)
    : { data: [] };
  const { data: profile } = user
    ? await supabase.from("profiles").select("account_type").eq("id", user.id).maybeSingle()
    : { data: null };
  const canCreate = Boolean(membership?.length && profile?.account_type === "ADMIN");
  const params = await searchParams;

  async function createLocation(formData: FormData) {
    "use server";
    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) redirect("/partner/login?next=/admin/locations");
    const [{ data: operator }, { data: currentProfile }] = await Promise.all([
      client.from("organization_memberships").select("role").eq("user_id", currentUser.id).in("role", ["OWNER", "ADMIN"]).limit(1),
      client.from("profiles").select("account_type").eq("id", currentUser.id).maybeSingle(),
    ]);
    if (!operator?.length || currentProfile?.account_type !== "ADMIN") redirect("/admin/locations?error=forbidden");
    const name = String(formData.get("name") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const state = String(formData.get("state") ?? "").trim();
    const pincode = String(formData.get("pincode") ?? "").trim();
    if (name.length < 2 || name.length > 120 || !city || city.length > 120 || !["Chhattisgarh", "Odisha"].includes(state) || !/^\d{6}$/.test(pincode))
      redirect("/admin/locations?error=invalid");
    const stateCode = state === "Chhattisgarh" ? "CG" : "OD";
    const { data: postalMatch, error: postalError } = await client.from("geo_post_offices")
      .select("pincode").eq("state_code", stateCode).eq("pincode", pincode).limit(1);
    if (postalError) redirect("/admin/locations?error=postal-unavailable");
    if (!postalMatch?.length) redirect("/admin/locations?error=pin");
    const { data: existing, error: lookupError } = await client.from("locations").select("id,name,city,state,pincode");
    if (lookupError) redirect("/admin/locations?error=save");
    if (existing?.some((location) =>
      [location.name, location.city ?? "", location.state ?? "", location.pincode ?? ""].map((value) => value.trim().toLocaleLowerCase()).join("|") ===
      [name, city, state, pincode].map((value) => value.toLocaleLowerCase()).join("|")))
      redirect("/admin/locations?error=duplicate");
    const { error: insertError } = await client.from("locations").insert({ name, city, state, pincode });
    if (insertError) redirect("/admin/locations?error=save");
    redirect("/admin/locations?added=1");
  }

  const message = params.error === "duplicate" ? "This location already exists. Choose it when creating a route." :
    params.error === "forbidden" ? "Only an authorized partner owner or admin can add locations." :
    params.error === "invalid" ? "Enter a name, city, state, and six-digit PIN." :
    params.error === "pin" ? "This PIN is not in the selected state's imported postal catalog. Check the state and PIN." :
    params.error === "postal-unavailable" ? "Postal validation is temporarily unavailable. Please try again later." :
    params.error ? "Location could not be saved. Please try again." : null;

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-primary">Route setup · Step 1</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Locations</h1><p className="mt-2 text-sm text-muted-foreground">Add real pickup and drop-off points before creating a route. Locations are shared across partners.</p></div>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/admin/locations/coverage">District & PIN coverage</Link></Button><Button asChild variant="outline"><Link href="/admin/routes">View routes</Link></Button></div>
    </div>
    {message && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{message}</p>}
    {params.added && <p role="status" className="rounded-lg border border-success/30 p-4 text-sm text-success">Location added. You can now use it in a route.</p>}
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Locations could not be loaded.</p>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-card"><h2 className="border-b px-5 py-4 font-semibold">Available locations ({locations?.length ?? 0})</h2>
        {!error && !locations?.length ? <div className="p-8 text-center"><MapPin className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-3 font-medium">No locations yet</p><p className="mt-1 text-sm text-muted-foreground">Add actual stops or cities to begin setting up routes.</p></div> :
          <ul className="divide-y">{locations?.map((location) => <li key={location.id} className="px-5 py-3"><p className="font-medium">{location.name}</p><p className="text-sm text-muted-foreground">{[location.city, location.state, location.pincode].filter(Boolean).join(", ") || "City and state not specified"}</p></li>)}</ul>}
      </section>
      <section className="h-fit rounded-2xl border bg-card p-5 shadow-card"><h2 className="font-semibold">Add location</h2><p className="mt-1 text-sm text-muted-foreground">Use the place name passengers will recognize.</p>
        {canCreate ? <form action={createLocation} className="mt-5 space-y-4"><Field label="Location name"><Input name="name" minLength={2} maxLength={120} required placeholder="e.g. Central Bus Stand" /></Field><Field label="City"><Input name="city" maxLength={120} required placeholder="e.g. Bhubaneswar" /></Field><label className="block text-sm font-medium">State<select name="state" required defaultValue="" className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Select state</option><option value="Chhattisgarh">Chhattisgarh</option><option value="Odisha">Odisha</option></select></label><Field label="PIN code"><Input name="pincode" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required placeholder="e.g. 751001" /></Field><p className="text-xs text-muted-foreground">Enter a real passenger pickup or drop-off point. The PIN verifies postal coverage; it does not verify that the stop is safe or served by your route.</p><Button type="submit" className="w-full">Add location</Button></form> : <p className="mt-5 text-sm text-muted-foreground">An authorized partner owner or admin account is required to add locations.</p>}
      </section>
    </div>
  </div>;
}
