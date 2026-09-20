import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Partner payments" };
const STATUS_STYLE: Record<string, string> = {
  SUCCESS: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  FAILED: "bg-destructive/10 text-destructive",
  REFUND_PENDING: "bg-warning/10 text-warning",
  REFUNDED: "bg-muted-foreground/10 text-muted-foreground",
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
  const { data: v } = org.length
    ? await s.from("vehicles").select("id").in("organization_id", org)
    : { data: [] };
  const { data: t } = (v ?? []).length
    ? await s
        .from("trips")
        .select("id")
        .in(
          "vehicle_id",
          (v ?? []).map((x) => x.id),
        )
    : { data: [] };
  const { data: b } = (t ?? []).length
    ? await s
        .from("bookings")
        .select("id")
        .in(
          "trip_id",
          (t ?? []).map((x) => x.id),
        )
    : { data: [] };
  const { data: p } = (b ?? []).length
    ? await s
        .from("payments")
        .select(
          "id,booking_id,provider,status,amount,currency,paid_at,created_at",
        )
        .in(
          "booking_id",
          (b ?? []).map((x) => x.id),
        )
        .order("created_at", { ascending: false })
    : { data: [] };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Payments</h1>
        <p className="mt-2 text-muted-foreground">
          Read-only settlement visibility for bookings on your fleet.
        </p>
      </div>
      {!p?.length ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          <CreditCard className="mx-auto mb-3 h-8 w-8" />
          No payments recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-card">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="p-4">Payment</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Paid</th>
              </tr>
            </thead>
            <tbody>
              {p.map((x) => (
                <tr key={x.id} className="border-b last:border-0">
                  <td className="p-4 font-mono text-xs">{x.id.slice(0, 8)}…</td>
                  <td className="p-4">{x.provider}</td>
                  <td className="p-4">₹{Number(x.amount).toFixed(2)}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[x.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {String(x.status).replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    {x.paid_at ? new Date(x.paid_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
