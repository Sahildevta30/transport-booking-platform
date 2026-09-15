# Backend Architecture

## Database

PostgreSQL via Supabase. No tables exist yet — Phase 1 documents the
intended domain model (see [domain model](../database/domain-model.md))
so Phase 2 implements it consistently instead of ad hoc.

## Supabase client separation

Three distinct clients, each with a narrow purpose:

| Client | File | Key used | Where it runs | Bypasses RLS? |
|---|---|---|---|---|
| Browser | `lib/supabase/client.ts` | anon | Client Components | No |
| Server | `lib/supabase/server.ts` | anon | Server Components, Server Actions, Route Handlers | No |
| Admin | `lib/supabase/admin.ts` | service role | Server-only, `import "server-only"` enforced | **Yes** |

The admin client is intentionally the hardest one to reach for by
accident: `server-only` makes importing it from client code a build
error, and it throws immediately if the service-role key isn't set. Every
call site that imports it should be treated as a place that needs its own
authorization check, since it skips the database's own (RLS).

## Row Level Security

No policies exist yet (no tables yet). The architectural commitment is
that RLS is the default protection layer for user-facing data — the
service-role client is for genuinely privileged, already-authorized
operations (webhooks, admin actions, scheduled jobs), not a workaround
for "RLS was inconvenient."

## Payments

`lib/payments/provider.ts` defines a `PaymentProvider` interface
(create payment, refund, verify webhook signature) with no concrete
implementation. No provider is hard-coded — see `.env.example` for where
provider credentials will eventually live, server-side only.

## Notifications

`lib/notifications/` documents the intended responsibility
(booking confirmations, reminders, cancellations) with no delivery
provider wired up yet.

## Validation

Zod schemas in `lib/validation/` are meant to run on both client and
server. Server Actions in Phase 2 should re-validate with the same
schema rather than trusting client-side validation alone.
