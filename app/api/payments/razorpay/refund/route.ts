import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RazorpayProvider } from "@/lib/payments/razorpay";

/**
 * Actually initiates the refund with Razorpay once cancel_booking() has
 * moved a paid booking to REFUND_PENDING.
 *
 * Without this route, REFUND_PENDING was a dead end: cancel_booking()
 * (phase 8) flips bookings.status and payments.status to REFUND_PENDING,
 * and the webhook (phase 7 hardening) is fully able to *receive*
 * refund.processed / refund.failed events and finalize the payment row —
 * but nothing anywhere ever called Razorpay's refund API to *produce*
 * that event. The customer's money never actually moved unless someone
 * manually issued the refund from the Razorpay dashboard.
 *
 * The refund amount is never taken from the client. It is re-read from
 * booking_cancellations.refund_amount, which cancel_booking() computed
 * server-side (capped at both the booking's amount and the sum of actual
 * SUCCESS payments) at cancellation time.
 *
 * Idempotent by design: if the payment row already has a
 * provider_refund_id, the provider is not called again — this makes it
 * safe to call from the client unconditionally after every cancellation,
 * and safe to retry (double-click, network retry, page refresh).
 */
export async function POST(request: Request) {
  try {
    const { bookingId } = (await request.json()) as { bookingId?: string };
    if (!bookingId) {
      return NextResponse.json({ error: "Booking is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: booking } = await supabase
      .from("bookings")
      .select("id,status")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (booking.status !== "REFUND_PENDING") {
      // Not an error — the panel calls this unconditionally after every
      // cancellation, and most cancellations have no prior successful
      // payment, so there is nothing to refund. This is the expected
      // no-op path for that case.
      return NextResponse.json({ refunded: false, reason: "not_refund_pending" });
    }

    const { data: payment } = await supabase
      .from("payments")
      .select("id,provider_payment_id,provider_refund_id")
      .eq("booking_id", bookingId)
      .eq("user_id", user.id)
      .eq("provider", "RAZORPAY")
      .eq("status", "REFUND_PENDING")
      .maybeSingle();

    if (!payment || !payment.provider_payment_id) {
      return NextResponse.json({ error: "No refundable payment found" }, { status: 409 });
    }

    if (payment.provider_refund_id) {
      return NextResponse.json({ refunded: true, alreadyInitiated: true });
    }

    const { data: cancellation } = await supabase
      .from("booking_cancellations")
      .select("refund_amount")
      .eq("booking_id", bookingId)
      .maybeSingle();
    const refundAmount = Number(cancellation?.refund_amount ?? 0);
    if (!(refundAmount > 0)) {
      return NextResponse.json({ error: "No refundable amount recorded" }, { status: 409 });
    }

    const provider = new RazorpayProvider();
    let refund: Awaited<ReturnType<RazorpayProvider["refund"]>>;
    try {
      refund = await provider.refund({
        providerReferenceId: payment.provider_payment_id,
        amountInSmallestUnit: Math.round(refundAmount * 100),
        reason: "Booking cancelled",
      });
    } catch {
      // Leave the payment in REFUND_PENDING — nothing was persisted, so a
      // later retry of this same route will attempt the provider call
      // again rather than silently giving up.
      return NextResponse.json(
        { error: "Refund could not be initiated. It will need manual follow-up." },
        { status: 502 },
      );
    }

    const now = new Date().toISOString();
    const admin = createAdminClient();
    const { error: persistError } = await admin
      .from("payments")
      .update({
        provider_refund_id: refund.providerRefundId,
        refund_amount: refundAmount,
        refund_initiated_at: now,
        updated_at: now,
      })
      .eq("id", payment.id)
      .eq("user_id", user.id);

    if (persistError) {
      // The refund was created at Razorpay but we failed to record it.
      // Do NOT retry the provider call from here — that would risk a
      // double refund. Surface this as a failure so it gets manual
      // attention instead of silently losing the reference.
      return NextResponse.json(
        { error: "Refund was initiated but could not be recorded. Contact support." },
        { status: 500 },
      );
    }

    return NextResponse.json({ refunded: true, providerRefundId: refund.providerRefundId });
  } catch {
    return NextResponse.json({ error: "Unable to process refund" }, { status: 500 });
  }
}
