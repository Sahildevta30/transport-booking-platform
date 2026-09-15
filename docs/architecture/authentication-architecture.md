# Authentication Architecture

## Provider

Supabase Auth. No custom password storage or session handling — Phase 1
establishes utilities around Supabase's own primitives rather than
reimplementing any of it.

## Account types vs. roles

Two separate concepts, deliberately not conflated:

- **Account type** (`CUSTOMER`, `ADMIN`, `STAFF`) — which area of the app
  someone belongs to.
- **Role** (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `DRIVER`, `AGENT`,
  `CUSTOMER`) — finer-grained permissions within that area, mostly
  relevant to the admin side. Modeled in `types/domain.ts` now; backed by
  real `roles`/`permissions` tables in Phase 2.

Neither is currently read from `user_metadata` (client-writable, so never
trustworthy for authorization) — `lib/auth/session.ts` explicitly leaves
`accountType` as `null` with a TODO pointing at the future `profiles`
table lookup instead.

## Session handling

- `lib/supabase/server.ts` reads/writes the Supabase auth cookie in
  Server Components, Server Actions, and Route Handlers.
- `proxy.ts` (Next.js 16's renamed middleware) refreshes the session on nearly every request and does
  a first-pass check: unauthenticated visits to `/customer/*` or
  `/admin/*` redirect to `/login` before the page even renders.
- `lib/auth/session.ts#getSessionUser()` is the one place that reads "who
  is the current user" — call it instead of touching
  `supabase.auth.getUser()` directly, so there's a single seam if the
  session model changes later.

## Authorization

`lib/auth/roles.ts` holds the authorization decisions
(`canAccessAdminArea`, `canAccessCustomerArea`, `hasRole`) as pure
functions, separate from session reading. Every protected layout
(`app/customer/layout.tsx`, `app/admin/layout.tsx`) calls both
`getSessionUser()` and the relevant `can*` check server-side — this is
defense in depth on top of `proxy.ts` (Next.js 16's renamed middleware), not a replacement for it.

**Current state**: because `accountType` isn't wired to real data yet,
`canAccessAdminArea()` always returns `false` and `/admin` is
unreachable by anyone. This is intentional — it fails closed rather than
letting anyone in until the real profiles lookup exists.

## What's explicitly not built yet

- Real account-type/role lookup (needs the `profiles` table)
- Password-reset landing page (`/reset-password` is referenced by
  `forgot-password/page.tsx` but not yet implemented)
- Fine-grained permissions (`permissions` table, `hasRole` real usage)
- Audit logging of authentication/authorization events
