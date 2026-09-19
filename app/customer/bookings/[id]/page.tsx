import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PaymentPanel } from "@/components/payments/payment-panel";
import { CancelBookingPanel } from "@/components/bookings/cancel-booking-panel";
import { createClient } from "@/lib/supabase/server";

/**
 * Plain helper, not a component: this Server Component renders once per
 * request, so reading "now" here is the correct way to decide whether a
 * departed trip can still be cancelled — there is no client re-render to
 * be impure across. Pulling it out of the component body keeps the actual
 * page render free of a direct Date.now() call.
 */
function isTripStillCancellable(status: string, departureAt: string | null): boolean {
  if (status !== "PENDING" && status !== "CONFIRMED") return false;
  if (!departureAt) return false;
  return new Date(departureAt).getTime() > Date.now();
}

type Props = { params: Promise<{ id: string }> };
export default async function BookingDetail({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/customer/bookings/${id}`);
  const { data: b } = await supabase
    .from("bookings")
    .select("id,trip_id,booking_mode,status,passenger_count,amount,created_at")
    .eq("id", id)
    .maybeSingle();
  if (!b) notFound();
  const [
    { data: trip },
    { data: passengers },
    { data: bookedSeats },
    { data: payments },
    { data: cancellation },
  ] = await Promise.all([
    supabase
      .from("trips")
      .select("route_id,vehicle_id,departure_at,arrival_at")
      .eq("id", b.trip_id)
      .maybeSingle(),
    supabase
      .from("booking_passengers")
      .select("id,full_name,phone")
      .eq("booking_id", b.id),
    supabase
      .from("booking_seats")
      .select("seat_id,released_at")
      .eq("booking_id", b.id),
    supabase
      .from("payments")
      .select("id,status,amount,currency,created_at")
      .eq("booking_id", b.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("booking_cancellations")
      .select("reason,refund_amount,created_at")
      .eq("booking_id", b.id)
      .maybeSingle(),
  ]);
  let seatNumbers: string[] = [];
  const activeSeats = (bookedSeats ?? []).filter((s) => !s.released_at);
  if (activeSeats.length) {
    const { data: seats } = await supabase
      .from("vehicle_seats")
      .select("id,seat_number")
      .in(
        "id",
        activeSeats.map((s) => s.seat_id),
      );
    seatNumbers = (seats ?? []).map((s) => s.seat_number);
  }
  const latestPayment = payments?.[0];
  const canCancel = !!trip && isTripStillCancellable(b.status, trip.departure_at);
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/customer/bookings">← My bookings</Link>
      </Button>
      <div>
        <p className="text-sm text-muted-foreground">Booking reference</p>
        <h1 className="text-4xl font-black tracking-tight">
          {b.id.slice(0, 8).toUpperCase()}
        </h1>
      </div>
      <div className="grid gap-4 rounded-[1.75rem] border bg-card p-6 shadow-sm sm:grid-cols-2">
        <p>
          <b>Status:</b> {b.status}
        </p>
        <p>
          <b>Mode:</b> {b.booking_mode.replaceAll("_", " ")}
        </p>
        <p>
          <b>Passengers:</b> {b.passenger_count}
        </p>
        <p>
          <b>Amount:</b> ₹{Number(b.amount).toFixed(2)}
        </p>
        {trip ? (
          <p>
            <b>Departure:</b> {new Date(trip.departure_at).toLocaleString()}
          </p>
        ) : null}
        {seatNumbers.length ? (
          <p>
            <b>Active seats:</b> {seatNumbers.join(", ")}
          </p>
        ) : null}
        {latestPayment ? (
          <p>
            <b>Payment:</b> {latestPayment.status}
          </p>
        ) : null}
      </div>
      {cancellation ? (
        <section className="rounded-[1.75rem] border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Cancellation</h2>
          <p className="mt-2 text-sm">
            Cancelled {new Date(cancellation.created_at).toLocaleString()}
          </p>
          {cancellation.reason ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Reason: {cancellation.reason}
            </p>
          ) : null}
          {Number(cancellation.refund_amount) > 0 ? (
            <p className="mt-2 font-medium">
              Refund amount: ₹{Number(cancellation.refund_amount).toFixed(2)} ·{" "}
              {b.status === "REFUNDED" ? "Refunded" : "Pending"}
            </p>
          ) : null}
        </section>
      ) : null}
      {b.status === "PENDING" && latestPayment?.status !== "SUCCESS" ? (
        <PaymentPanel bookingId={b.id} amount={Number(b.amount)} />
      ) : null}
      {canCancel ? <CancelBookingPanel bookingId={b.id} /> : null}
      <div>
        <h2 className="text-2xl font-black">Passengers</h2>
        <div className="mt-3 grid gap-3">
          {passengers?.map((p) => (
            <div key={p.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <p className="font-medium">{p.full_name}</p>
              <p className="text-sm text-muted-foreground">{p.phone}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
