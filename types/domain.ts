/** Shared domain vocabulary used across UI and validation. */

export const BOOKING_MODES = ["SEAT_BOOKING", "FULL_VEHICLE_BOOKING", "BOTH"] as const;
export type BookingMode = (typeof BOOKING_MODES)[number];

export const ACCOUNT_TYPES = ["CUSTOMER", "ADMIN", "STAFF"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ROLES = ["SUPER_ADMIN", "ADMIN", "STAFF", "DRIVER", "AGENT", "CUSTOMER"] as const;
export type Role = (typeof ROLES)[number];

export const TRIP_STATUSES = ["scheduled", "open", "full", "boarding", "in_progress", "completed", "cancelled"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const ACTIVE_TRIP_STATUSES: readonly TripStatus[] = ["scheduled", "open", "full", "boarding", "in_progress"];
