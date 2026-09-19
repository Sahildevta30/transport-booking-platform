import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RazorpayProvider } from "@/lib/payments/razorpay";
import type { Database } from "@/types/database";

type PaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error_code?: string;
  error_description?: string;
};
type RefundEntity = { id?: string; payment_id?: string; status?: string };
type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: PaymentEntity };
    refund?: { entity?: RefundEntity };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const provider = new RazorpayProvider();
  if (!provider.verifyWebhookSignature(rawBody, signature))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  let event: RazorpayWebhook;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `${event.event ?? "unknown"}:${signature.slice(0, 32)}`;
  const paymentEntity = event.payload?.payment?.entity;
  const refundEntity = event.payload?.refund?.entity;
  const admin = createAdminClient();
  let payment: {
    id: string;
    amount: number;
    currency: string;
    bookingId: string;
  } | null = null;
  if (paymentEntity?.order_id) {
    const { data } = await admin
      .from("payments")
      .select("id,amount,currency,booking_id")
      .eq("provider", "RAZORPAY")
      .eq("provider_order_id", paymentEntity.order_id)
      .maybeSingle();
    payment = data
      ? {
          id: data.id,
          amount: Number(data.amount),
          currency: data.currency,
          bookingId: data.booking_id,
        }
      : null;
  }
  if (!payment && refundEntity?.payment_id) {
    const { data } = await admin
      .from("payments")
      .select("id,amount,currency,booking_id")
      .eq("provider", "RAZORPAY")
      .eq("provider_payment_id", refundEntity.payment_id)
      .maybeSingle();
    payment = data
      ? {
          id: data.id,
          amount: Number(data.amount),
          currency: data.currency,
          bookingId: data.booking_id,
        }
      : null;
  }
  const { data: existing } = await admin
    .from("payment_events")
    .select("processed_at")
    .eq("provider", "RAZORPAY")
    .eq("provider_event_id", eventId)
    .maybeSingle();
  if (existing?.processed_at)
    return NextResponse.json({ ok: true, duplicate: true });
  if (!existing) {
    const { error } = await admin
      .from("payment_events")
      .insert({
        payment_id: payment?.id ?? null,
        provider: "RAZORPAY",
        provider_event_id: eventId,
        event_type: event.event ?? "unknown",
        payload: event as never,
        processed_at: null,
      });
    if (error && error.code !== "23505")
      return NextResponse.json(
        { error: "Unable to record event" },
        { status: 500 },
      );
  }
  if (!payment)
    return NextResponse.json({ error: "Payment not found" }, { status: 409 });
  const now = new Date().toISOString();
  let update: Database["public"]["Tables"]["payments"]["Update"] | null = null;
  if (event.event === "payment.captured" && paymentEntity?.id) {
    const expected = Math.round(payment.amount * 100);
    if (
      paymentEntity.amount !== expected ||
      paymentEntity.currency?.toUpperCase() !== payment.currency.toUpperCase()
    )
      return NextResponse.json(
        { error: "Payment amount or currency mismatch" },
        { status: 409 },
      );
    update = {
      provider_payment_id: paymentEntity.id,
      status: "SUCCESS",
      paid_at: now,
      failure_code: null,
      failure_message: null,
      updated_at: now,
    };
  } else if (event.event === "payment.failed")
    update = {
      provider_payment_id: paymentEntity?.id ?? null,
      status: "FAILED",
      failure_code: paymentEntity?.error_code ?? null,
      failure_message:
        paymentEntity?.error_description?.slice(0, 500) ?? "Payment failed",
      updated_at: now,
    };
  else if (event.event === "refund.processed")
    update = { status: "REFUNDED", updated_at: now };
  else if (event.event === "refund.failed")
    update = { status: "REFUND_PENDING", updated_at: now };
  if (update) {
    const { error } = await admin
      .from("payments")
      .update(update)
      .eq("id", payment.id);
    if (error)
      return NextResponse.json(
        { error: "Unable to process payment event" },
        { status: 500 },
      );

    // cancel_booking() (phase 8) moves bookings.status to REFUND_PENDING
    // when it cancels a paid booking, but nothing ever moved it forward
    // from there: this webhook only ever touched the payments row, so a
    // completed refund left the booking permanently stuck showing
    // "Refund pending" to the customer, and the REFUND_COMPLETED
    // notification (which fires off a bookings.status change, per
    // notify_booking_status_change()) never had anything to trigger it.
    // Finalizing the booking here, only once the refund has actually
    // completed at the provider, closes that loop without touching the
    // payments-side notification trigger (already correctly deduped
    // against this one in phase 9).
    if (event.event === "refund.processed") {
      const { error: bookingError } = await admin
        .from("bookings")
        .update({ status: "REFUNDED", updated_at: now })
        .eq("id", payment.bookingId)
        .eq("status", "REFUND_PENDING");
      if (bookingError)
        return NextResponse.json(
          { error: "Unable to finalize booking status" },
          { status: 500 },
        );
    }
  }
  const { error: processedError } = await admin
    .from("payment_events")
    .update({ payment_id: payment.id, processed_at: now })
    .eq("provider", "RAZORPAY")
    .eq("provider_event_id", eventId);
  if (processedError)
    return NextResponse.json(
      { error: "Unable to finalize payment event" },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
