# Booking Engine Architecture (Future — Not Implemented in Phase 1)

This document describes the intended design so Phase 2 builds it
consistently. Nothing described here exists in code yet.

## Two booking modes, one engine

Every `vehicle_type` carries a `booking_mode` of `SEAT_BOOKING`,
`FULL_VEHICLE_BOOKING`, or `BOTH` (see `types/domain.ts`). The booking
engine branches on this per vehicle type rather than having two entirely
separate codepaths:

- **Seat booking**: individual `trip_seats` are reserved against a
  specific `trip`. Requires seat-level locking to prevent double-booking
  under concurrent requests.
- **Whole vehicle booking**: the entire vehicle is reserved for a trip;
  no per-seat granularity.

## Concurrency & data integrity

Seat locking needs to survive concurrent requests for the same trip —
the real implementation should use database-level constraints/locking
(e.g. a unique constraint on `(trip_id, seat_id)` plus a short-lived
"hold" state before payment confirms the booking), not an
application-level mutex that can't coordinate across server instances.

## Booking lifecycle (planned)

```
search → select trip → select seats OR whole vehicle → passenger details
  → checkout/review → payment → booking confirmed
                                     │
                                     ├─ cancellation → refund (via
                                     │   lib/payments/provider.ts)
                                     └─ tracking (booking_tracking)
```

## Dependencies

The booking engine is meant to consume, not duplicate:
- `lib/vehicles/` for vehicle/seat data
- `lib/routes/` for route/trip/availability data
- `lib/pricing/` for the actual price (server-computed, never
  client-supplied)
- `lib/payments/provider.ts` for payment/refund processing
- `lib/notifications/` for confirmation/cancellation messaging
- `lib/analytics/events.ts` for the booking funnel events already listed
  in the analytics architecture

## Explicitly out of scope for Phase 1

Seat inventory, seat locking, the actual booking state machine, payment
gateway integration, refund processing, and coupon application logic are
all future work — see `README.md`'s roadmap section.
