# System Architecture

## Overview

The Transport Booking Platform is a Next.js (App Router) application backed
by Supabase (PostgreSQL + Auth + Storage). It serves three audiences from
one codebase:

- **Customer website** — public browsing, search, booking, and a customer
  dashboard.
- **Admin/Owner panel** — operational management of vehicles, routes,
  trips, bookings, pricing, and payments.
- **Future AI/ML layer** — sits behind a service boundary (`lib/ai/`) and
  never talks to the database directly.

## High-level request flow

```
Browser
  │
  ▼
Next.js (App Router)
  ├─ Server Components  → lib/supabase/server.ts  (RLS-scoped, per-user)
  ├─ Client Components  → lib/supabase/client.ts  (RLS-scoped, per-user)
  └─ Server Actions /    → lib/supabase/admin.ts  (service-role, server-only,
     Route Handlers        used sparingly for trusted privileged operations)
         │
         ▼
     Supabase (PostgreSQL + Row Level Security + Auth + Storage)
```

## Why this shape

- **RLS-first**: almost everything reads/writes through the anon-key
  clients, scoped by the user's own session. The service-role client
  (`lib/supabase/admin.ts`) is the exception, not the default — every use
  of it should be reviewable in a code review because it bypasses RLS.
- **Domain-organized `lib/`**: booking, vehicles, routes, pricing,
  payments, analytics, ai, and notifications are separate modules so
  Phase 2 can build each out independently without one giant "services"
  file.
- **AI/ML-ready without AI/ML implemented**: `lib/ai/provider.ts` defines
  the contract (parse intent → hand off to the real search/booking
  engine) so a real model can be plugged in later without restructuring
  how search or recommendations work.

## Deployment target

Vercel-ready: no code here assumes a specific host, but the project
structure (Route Handlers, middleware, environment variable conventions)
matches what Vercel expects out of the box.

See also:
- [Frontend architecture](./frontend-architecture.md)
- [Backend architecture](./backend-architecture.md)
- [Authentication architecture](./authentication-architecture.md)
- [Booking engine architecture (future)](./booking-engine-architecture.md)
- [AI architecture](./ai-architecture.md)
- [Analytics architecture](./analytics-architecture.md)
