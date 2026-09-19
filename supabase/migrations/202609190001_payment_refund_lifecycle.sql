-- Refund lifecycle tracking.
--
-- cancel_booking() (phase 8) moves a paid booking's payment row to
-- REFUND_PENDING, but nothing in the application ever called the payment
-- provider's refund API to actually return the customer's money — the
-- Razorpay webhook can *receive* refund.processed/refund.failed events,
-- but nothing *sent* the refund request that would produce them. A
-- cancelled, paid booking sat in REFUND_PENDING indefinitely.
--
-- These columns let the new /api/payments/razorpay/refund route record
-- what it did and stay idempotent — it must never call the provider's
-- refund API twice for the same payment.
alter table public.payments
  add column if not exists provider_refund_id text,
  add column if not exists refund_amount numeric(12,2),
  add column if not exists refund_initiated_at timestamptz;

-- A given provider refund id must map to exactly one payment. Partial
-- (not full) index so it never conflicts with the many rows that have no
-- refund at all.
create unique index if not exists payments_provider_refund_id_idx
  on public.payments(provider_refund_id)
  where provider_refund_id is not null;
