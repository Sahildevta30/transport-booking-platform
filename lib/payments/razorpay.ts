import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider, RefundInput, RefundResult } from "./provider";

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return { keyId, keySecret };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`, ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Razorpay request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export class RazorpayProvider implements PaymentProvider {
  readonly name = "RAZORPAY";

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const order = await request<{ id: string; status: string }>("/orders", {
      method: "POST",
      body: JSON.stringify({ amount: input.amountInSmallestUnit, currency: input.currency, receipt: input.bookingId, notes: { booking_id: input.bookingId } }),
    });
    return { providerReferenceId: order.id, status: "REQUIRES_ACTION" };
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const refund = await request<{ id: string; status: string }>(`/payments/${encodeURIComponent(input.providerReferenceId)}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount: input.amountInSmallestUnit, notes: input.reason ? { reason: input.reason } : undefined }),
    });
    return { providerRefundId: refund.id, status: refund.status === "processed" ? "PROCESSED" : refund.status === "failed" ? "FAILED" : "PENDING" };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signatureHeader) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected); const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
