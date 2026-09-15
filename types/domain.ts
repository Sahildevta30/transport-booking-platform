/**
 * Hand-authored domain types that aren't part of the generated Supabase
 * schema (see types/database.ts) — shared vocabulary used across the UI,
 * validation schemas, and future business logic. Keep this file small and
 * stable; anything table-shaped belongs in the generated types instead.
 */

/** How a vehicle type can be booked. Configurable per vehicle_type row. */
export const BOOKING_MODES = [
  "SEAT_BOOKING",
  "FULL_VEHICLE_BOOKING",
  "BOTH",
] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];

/** Account types established in the auth foundation (see docs/architecture/authentication-architecture.md). */
export const ACCOUNT_TYPES = ["CUSTOMER", "ADMIN", "STAFF"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** Future roles — not all are active yet, but the type exists so downstream code doesn't need reshaping later. */
export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "STAFF",
  "DRIVER",
  "AGENT",
  "CUSTOMER",
] as const;
export type Role = (typeof ROLES)[number];
