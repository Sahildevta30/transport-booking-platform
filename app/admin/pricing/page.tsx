import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Partner pricing" };
const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-muted-foreground/10 text-muted-foreground",
};

export default async function Page() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  const { data: m } = user
    ? await s
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
    : { data: [] };
  const org = (m ?? []).map((x) => x.organization_id);
  const { data: r } = org.length
    ? await s.from("routes").select("id,name").in("organization_id", org)
    : { data: [] };
  const ids = (r ?? []).map((x) => x.id);
  const { data: t } = ids.length
    ? await s
        .from("trips")
        .select("id,route_id,base_price,status,departure_at")
        .in("route_id", ids)
        .order("departure_at", { ascending: false })
    : { data: [] };
  const names = new Map((r ?? []).map((x) => [x.id, x.name]));
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Your fleet</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Pricing
          </h1>
          <p className="mt-2 text-muted-foreground">
            Trip prices configured for your organization. Prices are set when
            trips are scheduled.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/trips/new">Schedule priced trip</Link>
        </Button>
      </div>
      {!t?.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Tag className="mx-auto mb-3 h-8 w-8" />
          No priced trips yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-4">Route</th>
                  <th className="p-4">Departure</th>
                  <th className="p-4">Base price</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {t.map((x) => (
                  <tr key={x.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4 font-medium">
                      {names.get(x.route_id) ?? "Route"}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {new Date(x.departure_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold">
                      ₹{Number(x.base_price).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[x.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {String(x.status).replaceAll("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
