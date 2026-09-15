# Transport Booking Platform

A transport booking and management platform supporting both **seat
booking** and **whole-vehicle booking** across configurable vehicle types
(taxi/cab, bus, car, tempo traveller, and others) — a customer-facing
website plus an admin/owner panel, built on an architecture that's ready
for future AI/ML features without requiring a rewrite.

This is **Phase 1**: foundation, architecture, and project setup only.
No booking engine, payment processing, or AI features are implemented
yet — see [Roadmap](#roadmap) for what's intentionally deferred.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript (strict mode) |
| UI | Tailwind CSS + shadcn/ui-style components |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Validation | Zod + React Hook Form |
| Testing | Vitest (unit/integration) + Playwright (e2e) |
| Hosting | Vercel-ready |

Payment and AI providers are deliberately **not** chosen yet — both are
implemented as interfaces (`lib/payments/provider.ts`,
`lib/ai/provider.ts`) so a vendor can be plugged in later. See
[docs/decisions/0001-tech-stack.md](docs/decisions/0001-tech-stack.md).

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project's values
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

See [`.env.example`](.env.example) for the full list. At minimum, local
development needs a Supabase project's URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service-role key is privileged (bypasses Row Level Security) and
must **never** be exposed to client code — `lib/supabase/admin.ts`
enforces this at build time via the `server-only` package. Never commit
`.env.local` (already gitignored) or paste real keys into `.env.example`.

### Supabase project setup

No database schema exists yet (Phase 2 work — see
[docs/database/domain-model.md](docs/database/domain-model.md) for the
planned entities). To develop locally against a real project:

1. Create a Supabase project.
2. Copy its Project URL, anon key, and service role key into
   `.env.local`.
3. Auth works out of the box against Supabase Auth — no schema is
   required for the login/register/forgot-password flows to run,
   though real account-type/role data won't exist until the `profiles`
   table lands in Phase 2 (until then, `/admin` is intentionally
   unreachable — see
   [authentication architecture](docs/architecture/authentication-architecture.md)).

## Commands

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run start        # run the production build locally
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check
```

Vitest/Playwright configs will be added alongside the first real tests
in Phase 2 — `tests/{unit,integration,e2e}/` currently hold only
placeholder READMEs.

## Architecture overview

```
app/
├── (public)/    → customer-facing marketing + browsing pages
├── (auth)/      → login, register, forgot-password
├── customer/    → authenticated customer dashboard (session-gated)
├── admin/       → authenticated admin panel (session + role-gated)
└── api/         → Route Handlers (only /api/health exists so far)

components/
├── ui/          → generic primitives (Button, Card, Input, Label, Badge)
├── layout/      → site chrome (header, footer, empty-state shell)
└── {booking,search,vehicles,seats,customer,admin}/  → feature-specific (empty until Phase 2)

lib/
├── supabase/    → browser / server / admin clients (see below)
├── auth/        → session reading + authorization decisions
├── validation/  → shared Zod schemas
└── {booking,vehicles,routes,pricing,payments,analytics,ai,notifications}/
                    → one module per domain, documented via README until
                      Phase 2 implements each

types/           → domain enums (types/domain.ts) + generated Supabase
                    types placeholder (types/database.ts)

supabase/        → migrations/, seed/, tests/ — all empty until Phase 2
docs/            → architecture, database, api, ai, decisions
```

Full write-up: [docs/architecture/system-architecture.md](docs/architecture/system-architecture.md).

## Security principles

- **Row Level Security first.** The browser and server Supabase clients
  are both scoped by the anon key and the user's own session. The
  service-role client (`lib/supabase/admin.ts`) is the deliberate
  exception — guarded by `import "server-only"` so it can't end up in a
  client bundle, and treated as something every call site should
  justify, not a default.
- **No client-trusted authorization.** Account type/role checks happen
  server-side (`lib/auth/roles.ts`, called from `app/customer/layout.tsx`
  and `app/admin/layout.tsx`), on top of the session-refresh + first-pass
  redirect already done in `proxy.ts` (Next.js 16's renamed middleware).
  Two checkpoints, not one.
- **No secrets in the repo.** `.env.example` contains variable names
  only. `.env*` is gitignored.
- **No fabricated data anywhere.** No fake bookings, fake analytics,
  fake reviews, fake payment success, or fake AI responses — every
  screen that doesn't have real data yet says so explicitly via the
  shared `PagePlaceholder` component.

## Roadmap

**Implemented in Phase 1:**
- Project scaffold, design system, route architecture for all three
  audiences (customer/admin/auth)
- Supabase client architecture (browser/server/admin) and Auth-backed
  login/register/forgot-password
- Session + authorization foundation, middleware route protection
- Domain module boundaries and documentation for booking, vehicles,
  routes, pricing, payments, analytics, AI, and notifications

**Deferred to Phase 2+:**
- Database schema and migrations (see
  [docs/database/domain-model.md](docs/database/domain-model.md))
- `profiles` table + real account-type/role lookups (until then,
  `/admin` is unreachable by design)
- Booking engine: seat locking/inventory, whole-vehicle booking flow,
  passenger details, checkout
- Payment provider integration (provider not yet chosen) and refund
  processing
- Coupon engine, notification delivery (SMS/WhatsApp/email), driver
  system, live tracking
- Real analytics pipeline (event vocabulary already defined, not
  connected to a sink)
- AI/ML features: natural-language search, recommendations, demand
  forecasting (service boundary already defined, no model wired up)
