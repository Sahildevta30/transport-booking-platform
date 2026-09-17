# Production readiness

## Verified

- GitHub `main` is connected to Vercel and Phase 11 preview passed before merge.
- Supabase production schema has RLS enabled on protected customer/payment data.
- Booking creation and seat locking use server-side database RPCs with authenticated-only execution.
- Cancelled seat reservations can be reused; full-vehicle booking ignores released historical seats.
- Customer cancellation releases only locks associated with the cancelled booking.
- Placeholder MANUAL payment initiation is disabled in the customer UI.
- Analytics foundation and admin analytics summary are present.
- Notification records and customer notification UI are present.

## Intentional / informational database advisor findings

- `payment_events` has RLS with no client policy by design; it is not a customer-readable event ledger.
- Customer-facing transactional RPCs use `SECURITY DEFINER` intentionally and enforce authentication/ownership in their bodies. Keep grants narrow and audit these functions whenever changed.
- Unused-index notices are expected while production data/workload is small. Remove indexes only after workload evidence.

## External configuration still required before accepting real money / sending external messages

- Configure a real payment provider and webhook verification. Until then online payment remains disabled.
- Configure an external notification provider for EMAIL/SMS/WHATSAPP if those channels are required. In-app notifications do not require this.
- Enable Supabase leaked-password protection when the project/account supports the desired Auth configuration.
- Configure custom SMTP if production email volume/reliability must exceed Supabase built-in email limits.

## Release rule

Never represent payment, refund, external SMS/WhatsApp/email delivery, or AI-generated availability/pricing as successful unless confirmed by the real provider/application database. Availability, fares, seat ownership, booking status and payment status remain authoritative in PostgreSQL/application engines.
