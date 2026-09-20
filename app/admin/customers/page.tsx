import type { Metadata } from "next";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Partner customers" };
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
  const { data: v } = org.length
    ? await s.from("vehicles").select("id").in("organization_id", org)
    : { data: [] };
  const vids = (v ?? []).map((x) => x.id);
  const { data: t } = vids.length
    ? await s.from("trips").select("id").in("vehicle_id", vids)
    : { data: [] };
  const tids = (t ?? []).map((x) => x.id);
  const { data: b } = tids.length
    ? await s
        .from("bookings")
        .select("user_id,amount,status,created_at")
        .in("trip_id", tids)
    : { data: [] };
  const ids = [...new Set((b ?? []).map((x) => x.user_id))];
  const { data: p } = ids.length
    ? await s.from("profiles").select("id,full_name,phone").in("id", ids)
    : { data: [] };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-2 text-muted-foreground">
          Customers who booked with your fleet.
        </p>
      </div>
      {!p?.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 h-8 w-8" />
          No fleet customers yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Bookings</th>
                  <th className="p-4">Booked value</th>
                </tr>
              </thead>
              <tbody>
                {p.map((x) => {
                  const own = (b ?? []).filter((y) => y.user_id === x.id);
                  return (
                    <tr key={x.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">
                        {x.full_name ?? "Customer"}
                      </td>
                      <td className="p-4">{x.phone ?? "—"}</td>
                      <td className="p-4">{own.length}</td>
                      <td className="p-4">
                        ₹
                        {own.reduce((n, y) => n + Number(y.amount), 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
