# Payments domain

`provider.ts` defines the `PaymentProvider` interface (create payment,
refund, verify webhook signature). No concrete provider is implemented —
that's a project-owner decision (Razorpay/Cashfree/PhonePe/Stripe/etc.)
plus Phase 2+ work once credentials exist as server-only env vars.
