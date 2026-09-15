/**
 * Analytics event abstraction (see docs/architecture/analytics-architecture.md).
 *
 * This defines the *shape* of events, not a working pipeline yet — no
 * events are actually sent anywhere in Phase 1. Wiring this to
 * `analytics_events` (Supabase) or a third-party sink is Phase 2+ work.
 *
 * Hard rule: NEVER put passwords, auth tokens, payment credentials, or any
 * other secret into an event's payload. If you're not sure whether a field
 * is sensitive, leave it out.
 */

export const ANALYTICS_EVENTS = [
  "search_performed",
  "route_viewed",
  "trip_viewed",
  "vehicle_viewed",
  "seat_selected",
  "booking_started",
  "booking_abandoned",
  "booking_completed",
  "booking_cancelled",
  "recommendation_viewed",
  "recommendation_clicked",
] as const;
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: string;
}

/**
 * Placeholder track function. Currently a no-op (safe to call anywhere)
 * so call sites can be wired into the UI now and connected to a real
 * sink later without touching every call site again.
 */
export function trackEvent(payload: AnalyticsPayload): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics:noop]", payload);
  }
}
