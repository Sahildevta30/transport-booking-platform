# Frontend Architecture

## Routing

App Router with route groups so each audience has its own layout without
polluting the URL structure:

- `app/(public)/` — homepage, search, vehicles, routes, booking, legal
  pages. Wrapped in `SiteHeader` / `SiteFooter`.
- `app/(auth)/` — login, register, forgot-password. Minimal chrome,
  centered card layout.
- `app/customer/` — dashboard, bookings, profile. Server-gated: the
  layout calls `getSessionUser()` and redirects to `/login` if there's no
  session.
- `app/admin/` — dashboard, bookings, customers, vehicles, routes, trips,
  pricing, payments, analytics, settings. Server-gated on both
  authentication *and* `canAccessAdminArea()` — currently fails closed
  until Phase 2 wires up real account types from the `profiles` table.
- `app/api/` — Route Handlers. Only `health` exists in Phase 1.

`proxy.ts` (Next.js 16's renamed middleware) runs on nearly every request to refresh the Supabase
session cookie and do a first-pass redirect for unauthenticated visits to
`/customer/*` or `/admin/*`. Each area's `layout.tsx` re-checks
authorization server-side — the middleware check is a fast first gate,
not the only one.

## Component organization

- `components/ui/` — generic, unstyled-opinion primitives (Button, Card,
  Input, Label, Badge), following shadcn/ui conventions
  (`components.json`, `cn()` in `lib/utils.ts`). Add more via the same
  pattern as needed.
- `components/layout/` — site chrome shared across pages (header, footer,
  the `PagePlaceholder` empty-state shell).
- `components/{booking,search,vehicles,seats,customer,admin}/` —
  feature-specific components. Empty in Phase 1 by design; each fills in
  as its corresponding domain is implemented.

## Design system

Tokens live in `app/globals.css` as HSL CSS variables (light + dark),
consumed via Tailwind v4's `@theme inline`. This keeps the palette in one
place and lets `dark:` variants and future theming work without touching
component code.

## State & data fetching

Phase 1 has no client-side data fetching library (React Query, SWR, etc.)
because there's no real data yet. Server Components + Server Actions are
the default for Phase 2; introduce a client-state library only if a
specific flow (e.g. live seat selection) genuinely needs it.

## Forms & validation

React Hook Form + Zod, with the Zod schema as the single source of truth
(`lib/validation/`). The same schema is meant to be reused for
server-side validation once Server Actions replace the direct
`supabase.auth.*` calls currently used for auth forms.
