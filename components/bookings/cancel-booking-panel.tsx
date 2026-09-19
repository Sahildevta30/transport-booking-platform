"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/events";

function safeMessage(message: string) {
  const m = message.toLowerCase();
  if (m.includes("not found")) return "Booking was not found.";
  if (m.includes("cannot be cancelled")) return "This booking can no longer be cancelled.";
  if (m.includes("already departed"))
    return "This trip has already departed and cannot be cancelled.";
  if (m.includes("authentication")) return "Please sign in again.";
  return "Could not cancel booking. Please try again.";
}

/**
 * After cancel_booking() reports REFUND_PENDING, this fires the refund
 * initiation route. It never blocks or fails the cancellation itself —
 * the booking is already cancelled by this point regardless of what
 * happens here — and it is safe to call every time: the route is a no-op
 * when there is nothing to refund, and idempotent when a refund was
 * already initiated (e.g. a previous attempt succeeded but the response
 * was lost).
 */
async function initiateRefund(bookingId: string): Promise<"refunded" | "not_applicable" | "failed"> {
  try {
    const response = await fetch("/api/payments/razorpay/refund", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    if (!response.ok) return "failed";
    const data = (await response.json()) as { refunded?: boolean };
    return data.refunded ? "refunded" : "not_applicable";
  } catch {
    return "failed";
  }
}

export function CancelBookingPanel({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function cancel() {
    if (!window.confirm("Cancel this booking? Released seats may become available to other customers.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("cancel_booking", {
        p_booking_id: bookingId,
        p_reason: reason.trim() || undefined,
      });
      if (error) {
        setMessage(safeMessage(error.message));
        return;
      }
      void trackEvent(supabase, { event: "booking_cancelled", properties: { bookingId, status: data } });

      if (data === "REFUND_PENDING") {
        const refundOutcome = await initiateRefund(bookingId);
        setMessage(
          refundOutcome === "refunded"
            ? "Booking cancelled. Your refund has been initiated."
            : "Booking cancelled. Refund is pending — this may take a moment to process; contact support if it doesn't update soon.",
        );
      } else {
        setMessage("Booking cancelled successfully.");
      }
      router.refresh();
    } catch {
      setMessage("Could not cancel booking. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="text-xl font-semibold">Cancel booking</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Cancellation is allowed only before departure. If a successful payment exists, a refund is
        initiated automatically.
      </p>
      <label className="mt-4 block text-sm font-medium" htmlFor="cancel-reason">
        Reason (optional)
      </label>
      <textarea
        id="cancel-reason"
        className="mt-2 min-h-24 w-full rounded-md border bg-background p-3 text-sm"
        value={reason}
        maxLength={500}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Tell us why you are cancelling"
      />
      <Button className="mt-4" variant="destructive" disabled={busy} onClick={cancel}>
        {busy ? "Cancelling…" : "Cancel booking"}
      </Button>
      {message ? (
        <p className="mt-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}

