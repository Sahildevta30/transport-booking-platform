/**
 * Payment provider abstraction.
 *
 * No provider (Razorpay, Cashfree, PhonePe, Stripe, etc.) is chosen or
 * hard-coded yet — that decision belongs to the project owner. This
 * interface exists so the rest of the app (checkout flow, refunds,
 * webhooks) can be built against a stable contract, and swapping or
 * adding a provider later means writing one adapter, not touching every
 * call site.
 *
 * DO NOT implement a concrete provider against this interface until a
 * provider is chosen and its credentials are available as server-only
 * env vars. DO NOT fake a "success" response anywhere in the codebase.
 */

export interface CreatePaymentInput {
  bookingId: string;
  amountInSmallestUnit: number; // paise for INR, cents for USD, etc.
  currency: string;
  customerId: string;
}

export interface CreatePaymentResult {
  providerReferenceId: string;
  status: "PENDING" | "REQUIRES_ACTION";
  /** Provider-specific redirect/checkout URL, if the flow needs one. */
  redirectUrl?: string;
}

export interface RefundInput {
  providerReferenceId: string;
  amountInSmallestUnit: number;
  reason?: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  refund(input: RefundInput): Promise<RefundResult>;
  /** Verifies an inbound webhook signature before trusting its payload. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
}
