"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type CheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: CheckoutResponse) => void;
  theme?: Record<string, string>;
};
type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load Razorpay")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay"));
    document.body.appendChild(script);
  });
}

export function PaymentPanel({
  bookingId,
  amount,
}: {
  bookingId: string;
  amount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function pay() {
    setBusy(true);
    setMessage(null);
    try {
      await loadCheckout();
      const orderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const order = (await orderResponse.json()) as {
        orderId?: string;
        keyId?: string;
        amount?: number;
        currency?: string;
        error?: string;
      };
      if (!orderResponse.ok || !order.orderId || !order.keyId || !order.amount)
        throw new Error(order.error ?? "Unable to start payment");
      if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: "Transport Booking",
        description: `Booking ${bookingId.slice(0, 8).toUpperCase()}`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(
              "/api/payments/razorpay/verify",
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ bookingId, ...response }),
              },
            );
            const result = (await verifyResponse.json()) as {
              verified?: boolean;
              error?: string;
            };
            if (!verifyResponse.ok || !result.verified)
              throw new Error(result.error ?? "Payment verification failed");
            setMessage(
              "Payment response verified. Final payment status will be confirmed by the payment service.",
            );
            router.refresh();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "Payment verification failed",
            );
          } finally {
            setBusy(false);
          }
        },
      });
      checkout.on("payment.failed", () => {
        setMessage(
          "Payment failed or was cancelled. No success has been recorded.",
        );
        setBusy(false);
      });
      checkout.open();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to start payment",
      );
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-xl font-semibold">Payment</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Payable amount: ₹{Number(amount).toFixed(2)}
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Secure test payment powered by Razorpay. A verified checkout response is
        not treated as final settlement until the provider confirms it.
      </p>
      {message ? (
        <p className="mt-3 rounded-lg border p-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <Button className="mt-4" onClick={pay} disabled={busy}>
        {busy ? "Starting payment…" : "Pay with Razorpay"}
      </Button>
    </section>
  );
}
