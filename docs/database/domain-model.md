# Domain Model (Planned — No Tables Exist Yet)

This documents the entities the codebase is organized around, so Phase 2
implements them as a coherent schema instead of ad hoc, incremental
tables. Nothing here is a live Supabase table yet — that's Phase 2 work,
delivered as reviewable migrations under `supabase/migrations/`.

## Identity & access

- **profiles** — one row per authenticated user; extends Supabase Auth's
  `auth.users` with app-specific fields (account type, name, phone).
- **roles**, **permissions** — fine-grained authorization beyond the
  coarse `CUSTOMER` / `ADMIN` / `STAFF` account type.
- **audit_logs** — who did what, when, especially for admin actions.

## Vehicles

- **vehicle_types** — configurable categories (Taxi/Cab, Bus, Car, Tempo
  Traveller, others), each with a `booking_mode`
  (`SEAT_BOOKING` / `FULL_VEHICLE_BOOKING` / `BOTH`).
- **vehicles** — individual vehicles belonging to a vehicle_type.
- **vehicle_seats** — seat map for seat-bookable vehicles.
- **vehicle_amenities** — amenities per vehicle (AC, WiFi, etc.).
- **vehicle_maintenance** — maintenance records/schedule.
- **drivers** — driver records, eventually linked to vehicles/trips.

## Routes & trips

- **routes** — origin/destination route definitions.
- **route_stops**, **pickup_points**, **drop_points** — stop-level detail
  on a route.
- **trips** — a scheduled run of a route on a specific date/time with a
  specific vehicle.
- **trip_seats** — per-trip seat availability (for seat-bookable trips).

## Bookings & payments

- **bookings** — a customer's reservation (seat-based or whole-vehicle).
- **booking_passengers** — passenger details attached to a booking.
- **booking_seats** — which seats a booking occupies (seat mode only).
- **payments** — payment records, provider-agnostic (see
  [backend architecture](./architecture/backend-architecture.md)).
- **refunds** — refund records tied to a payment/booking.
- **pricing_rules**, **coupons** — pricing inputs; the actual price is
  always computed server-side.

## Engagement

- **notifications** — booking confirmations, reminders, cancellations.
- **reviews** — customer reviews of trips/vehicles.
- **analytics_events** — the event log described in
  [analytics architecture](./architecture/analytics-architecture.md).
- **recommendations**, **ai_insights** — targets for future AI/ML
  features (see [AI architecture](./architecture/ai-architecture.md)).
  No code writes to these yet.

## Platform

- **site_settings** — configurable platform-wide settings for the admin
  panel.

## Notes for Phase 2 implementation

- Every table needs an explicit Row Level Security policy before it's
  considered done — "add the table" and "secure the table" are one unit
  of work, not two.
- `booking_mode` on `vehicle_types` should drive which of
  `vehicle_seats` / `trip_seats` / `booking_seats` are relevant for a
  given vehicle — don't require seat data for whole-vehicle-only types.
