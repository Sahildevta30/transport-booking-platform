# Analytics Architecture

## Principle

Analytics is part of the architecture from day one, but no pipeline is
live in Phase 1 — `lib/analytics/events.ts` defines the event vocabulary
and a no-op `trackEvent()` so call sites can be wired into the UI now and
pointed at a real sink later without touching every call site again.

## Event vocabulary

`search_performed`, `route_viewed`, `trip_viewed`, `vehicle_viewed`,
`seat_selected`, `booking_started`, `booking_abandoned`,
`booking_completed`, `booking_cancelled`, `recommendation_viewed`,
`recommendation_clicked`.

These map to the `analytics_events` table in the domain model (see
[domain model](../database/domain-model.md)) — the table exists as a
planned target, not yet created.

## What must never be tracked

Passwords, authentication secrets/tokens, payment credentials, or any
other private security token. If a field's sensitivity is unclear, leave
it out of the event payload rather than guessing.

## Current behavior

`trackEvent()` only logs to the console in development (`NODE_ENV ===
"development"`) and is otherwise a no-op. No events are sent to
Supabase, a third-party analytics service, or anywhere else yet. Wiring
it to `analytics_events` (or an external sink) is Phase 2+ work.
