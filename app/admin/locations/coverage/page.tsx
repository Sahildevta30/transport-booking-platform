import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Location coverage" };
type Params = { state?: string; pin?: string };

export default async function CoveragePage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const state = params.state === "CG" || params.state === "OD" ? params.state : "CG";
  const pin = String(params.pin ?? "").trim();
  const validPin = /^\d{6}$/.test(pin);
  const supabase = await createClient();
  const { data: districts, error: districtError } = await supabase
    .from("geo_districts").select("name,state_code").eq("state_code", state).order("name");
  const { data: offices, error: officeError } = validPin
    ? await supabase.from("geo_post_offices")
        .select("district,office_name,pincode").eq("state_code", state).eq("pincode", pin)
        .order("office_name").limit(100)
    : { data: [], error: null };
  const stateName = state === "CG" ? "Chhattisgarh" : "Odisha";

  return <div className="mx-auto max-w-5xl space-y-6">
    <div>
      <Link href="/admin/locations" className="text-sm text-muted-foreground hover:text-foreground">← Back to locations</Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Location coverage</h1>
      <p className="mt-2 text-sm text-muted-foreground">Browse verified administrative districts and look up India Post offices by PIN. Partner-approved boarding points are managed separately in Locations.</p>
    </div>
    <form className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-end" action="/admin/locations/coverage">
      <label className="flex-1 text-sm font-medium">State
        <select name="state" defaultValue={state} className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="CG">Chhattisgarh</option><option value="OD">Odisha</option>
        </select>
      </label>
      <label className="flex-1 text-sm font-medium">PIN code
        <Input className="mt-2" name="pin" defaultValue={pin} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="Enter a 6-digit PIN" />
      </label>
      <Button type="submit">Show coverage</Button>
    </form>
    {districtError ? <p role="alert" className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">District catalog is not available yet. Run the reviewed geography migration before using this page.</p> :
      <section className="rounded-2xl border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">{stateName} districts ({districts?.length ?? 0})</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{districts?.map(d => <li className="rounded-lg bg-muted/50 px-3 py-2 text-sm" key={d.name}>{d.name}</li>)}</ul>
      </section>}
    {pin && !validPin ? <p role="alert" className="text-sm text-destructive">Enter exactly six digits to search post offices.</p> : null}
    {validPin ? <section className="rounded-2xl border bg-card p-5 shadow-card">
      <h2 className="text-lg font-semibold">Post offices for {pin}</h2>
      {officeError ? <p role="alert" className="mt-3 text-sm text-destructive">Postal catalog is not available yet.</p> : offices?.length ?
        <ul className="mt-4 divide-y">{offices.map(o => <li className="py-3 text-sm" key={`${o.district}-${o.office_name}`}><span className="font-medium">{o.office_name}</span><span className="text-muted-foreground"> · {o.district}</span></li>)}</ul> :
        <p className="mt-3 text-sm text-muted-foreground">No post office found for this PIN in {stateName}. The official postal import may still be pending.</p>}
      <p className="mt-4 text-xs text-muted-foreground">A post office or PIN is not automatically a passenger pickup point.</p>
    </section> : null}
  </div>;
}
