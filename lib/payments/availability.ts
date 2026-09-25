import "server-only";

/** Checkout requires an explicit production decision and complete credentials. */
export function razorpayCheckoutEnabled(): boolean {
  return process.env.RAZORPAY_CHECKOUT_ENABLED === "true" &&
    Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_WEBHOOK_SECRET);
}
