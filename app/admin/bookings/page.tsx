import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Ticket, UsersRound, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = { title: "Partner bookings" };
// Same status vocabulary and colors as the customer-facing My Bookings
// page (app/customer/bookings/page.tsx) -- a booking's status should
// read the same color everywhere it appears in the product.
const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-success/10 text-success",
  PENDING: "bg-warning/10 text-warning",
  COMPLETED: "bg-primary/10 text-primary",
  CANCELLED: "bg-muted-foreground/10 text-muted-foreground",
  REFUND_PENDING: "bg-warning/10 text-warning",
  REFUNDED: "bg-muted-foreground/10 text-muted-foreground",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ result?: string; error?: string }> }) {
  const params = await searchParams;
  async function decideBooking(formData: FormData) {
    "use server";
    const bookingId = String(formData.get("booking_id") ?? "");
    const decision = String(formData.get("decision") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !["CONFIRM", "REJECT", "COMPLETE"].includes(decision))
      redirect("/admin/bookings?error=invalid");
    if (decision === "CONFIRM" && formData.get("ack") !== "reconfirmed")
      redirect("/admin/bookings?error=invalid");
    if (decision === "REJECT" && (formData.get("ack") !== "yes" || reason.length < 2 || reason.length > 500))
      redirect("/admin/bookings?error=invalid");
    const client = await createClient();
    const { data: { user: actor } } = await client.auth.getUser();
    if (!actor) redirect("/partner/login?next=/admin/bookings");
    const { error } = decision === "COMPLETE"
      ? await client.rpc("partner_complete_booking", { p_booking_id: bookingId })
      : await client.rpc("partner_decide_booking", {
          p_booking_id: bookingId,
          p_decision: decision,
          p_reason: decision === "REJECT" ? reason : null,
        });
    if (error) {
      const code = error.message.includes("payment") || error.message.includes("Payment") ? "payment" : "failed";
      redirect(`/admin/bookings?error=${code}`);
    }
    redirect(`/admin/bookings?result=${decision === "CONFIRM" ? "confirmed" : decision === "COMPLETE" ? "completed" : "rejected"}`);
  }
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
  const orgIds = (memberships ?? []).map((x) => x.organization_id);
  const { data: vehicles } = orgIds.length
    ? await supabase
        .from("vehicles")
        .select("id,label")
        .in("organization_id", orgIds)
    : { data: [] };
  const vehicleIds = (vehicles ?? []).map((v) => v.id);
  const { data: trips } = vehicleIds.length
    ? await supabase
        .from("trips")
        .select("id,vehicle_id,departure_at,arrival_at,status")
        .in("vehicle_id", vehicleIds)
    : { data: [] };
  const tripIds = (trips ?? []).map((t) => t.id);
  const { data: bookings, error } = tripIds.length
    ? await supabase
        .from("bookings")
        .select(
          "id,trip_id,user_id,status,booking_mode,passenger_count,amount,created_at",
        )
        .in("trip_id", tripIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  const bookingIds = (bookings ?? []).map((b) => b.id);
  const { data: passengerContacts } = bookingIds.length
    ? await supabase.from("booking_passengers").select("booking_id,full_name,phone").in("booking_id", bookingIds)
    : { data: [] };
  const contactMap = new Map<string, { full_name: string; phone: string }[]>();
  for (const contact of passengerContacts ?? []) {
    const list = contactMap.get(contact.booking_id) ?? [];
    list.push(contact);
    contactMap.set(contact.booking_id, list);
  }
  const tripMap = new Map((trips ?? []).map((t) => [t.id, t]));
  const vehicleMap = new Map((vehicles ?? []).map((v) => [v.id, v.label]));
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-primary">Partner operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bookings</h1>
        <p className="mt-2 text-muted-foreground">
          Customer bookings for your organization only.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Call the listed passenger to reconfirm trip details, then confirm the request. Only your company can see its passenger contacts. After the trip finishes, close it as completed. Unpaid requests can be rejected before departure.</p>
      </div>
      {params.result ? <p role="status" className="rounded-lg border border-success/30 p-4 text-sm text-success">Booking {params.result === "confirmed" ? "confirmed" : params.result === "completed" ? "completed" : "rejected"}.</p> : null}
      {params.error ? <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">{params.error === "payment" ? "Payment is active or completed. Review its payment/refund before changing this booking." : params.error === "invalid" ? "Enter a rejection reason and confirm the action." : "Booking could not be changed. It may have already changed or departed. Refresh and try again."}</p> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Ticket}
          label="Total bookings"
          value={(bookings ?? []).length}
        />
        <Metric
          icon={UsersRound}
          label="Passengers"
          value={(bookings ?? []).reduce((n, b) => n + b.passenger_count, 0)}
        />
        <Metric
          icon={IndianRupee}
          label="Booking value"
          value={
            "₹" +
            (bookings ?? [])
              .reduce((n, b) => n + Number(b.amount), 0)
              .toFixed(0)
          }
        />
      </div>
      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        {error ? (
          <p className="p-6 text-destructive">Bookings could not be loaded.</p>
        ) : !bookings?.length ? (
          <div className="p-12 text-center text-muted-foreground">
            <Ticket className="mx-auto mb-3 h-9 w-9" />
            <p>No bookings for your fleet yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  {[
                    "Booking",
                    "Vehicle",
                    "Departure",
                    "Mode",
                    "Passengers",
                    "Amount",
                    "Status",
                    "Passenger contact",
                    "Decision",
                  ].map((x) => (
                    <th key={x} className="px-5 py-3">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => {
                  const t = tripMap.get(b.trip_id);
                  return (
                    <tr key={b.id} className="hover:bg-muted/30">
                      <td className="px-5 py-4 font-mono text-xs">
                        {b.id.slice(0, 8)}…
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {t ? (vehicleMap.get(t.vehicle_id) ?? "—") : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {t ? new Date(t.departure_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", timeZoneName: "short" }) : "—"}
                      </td>
                      <td className="px-5 py-4">
                        {b.booking_mode.replaceAll("_", " ")}
                      </td>
                      <td className="px-5 py-4">{b.passenger_count}</td>
                      <td className="px-5 py-4">
                        ₹{Number(b.amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[b.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {b.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs">{contactMap.get(b.id)?.map((p, i) => <p key={`${p.phone}-${i}`} className="whitespace-nowrap">{p.full_name} · <a href={`tel:${p.phone}`} className="text-primary underline">{p.phone}</a></p>) ?? <span className="text-muted-foreground">Contact unavailable</span>}</td>
                      <td className="px-5 py-4">
                        {b.status === "PENDING" && t && new Date(t.departure_at) > new Date() ? <div className="flex min-w-44 flex-col gap-2">
                          <form action={decideBooking} className="space-y-2"><input type="hidden" name="booking_id" value={b.id}/><input type="hidden" name="decision" value="CONFIRM"/><label className="flex items-start gap-2 text-xs"><input type="checkbox" name="ack" value="reconfirmed" required/>I spoke with the customer and reconfirmed this trip.</label><Button type="submit" size="sm">Confirm booking</Button></form>
                          <details className="text-xs"><summary className="cursor-pointer text-destructive">Reject request…</summary><form action={decideBooking} className="mt-2 space-y-2"><input type="hidden" name="booking_id" value={b.id}/><input type="hidden" name="decision" value="REJECT"/><label className="block">Reason<input name="reason" required minLength={2} maxLength={500} className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-foreground"/></label><label className="flex items-start gap-2"><input type="checkbox" name="ack" value="yes" required/>I confirm this unpaid booking should be rejected.</label><Button type="submit" size="sm" variant="destructive">Reject booking</Button></form></details>
                        </div> : b.status === "CONFIRMED" && t?.arrival_at && new Date(t.arrival_at) <= new Date() && t.status !== "cancelled" ? <form action={decideBooking}><input type="hidden" name="booking_id" value={b.id}/><input type="hidden" name="decision" value="COMPLETE"/><Button type="submit" size="sm" variant="outline">Close completed trip</Button></form> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
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
  icon: typeof Ticket;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
