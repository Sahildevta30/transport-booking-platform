# ADR 0001: Phase 1 Technology Stack

## Status
Accepted

## Context
Phase 1 needed to pick a stack that supports a customer site, an admin
panel, future AI/ML features, and a production payment integration,
without locking in a specific AI or payment vendor.

## Decision
- **Next.js (App Router) + TypeScript** — one codebase for customer and
  admin surfaces, server-first rendering, mature Vercel deployment path.
- **Tailwind CSS + shadcn/ui** — fast, consistent UI without a heavy
  component library dependency (components are copied into the repo,
  not installed as an opaque package).
- **Supabase (PostgreSQL + Auth + Storage)** — Postgres gives real
  relational integrity for a booking domain (seat inventory, pricing)
  that a document store would make harder; Supabase Auth avoids
  hand-rolling session/password handling.
- **Zod + React Hook Form** — one validation schema reusable on client
  and server.
- **Vitest + Playwright** — unit/integration and end-to-end coverage
  with widely-used tooling.

## Consequences
- Payment provider and AI provider are both implemented as interfaces
  (`lib/payments/provider.ts`, `lib/ai/provider.ts`) rather than SDKs
  called directly from feature code, so choosing a vendor later doesn't
  require revisiting every call site.
- Row Level Security becomes the primary authorization mechanism for
  data access; the service-role Supabase client is treated as a
  reviewable exception, not a default.
