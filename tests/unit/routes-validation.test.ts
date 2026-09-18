import { describe, expect, it } from "vitest";
import { routeSchema, tripSchema } from "@/lib/validation/routes";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("routeSchema", () => {
  it("accepts a valid route", () => {
    expect(routeSchema.safeParse({ organizationId: id(1), name: "Rourkela to Bhubaneswar", originLocationId: id(2), destinationLocationId: id(3), distanceKm: 330, estimatedDurationMinutes: 420 }).success).toBe(true);
  });
  it("rejects identical origin and destination", () => {
    expect(routeSchema.safeParse({ organizationId: id(1), name: "Invalid route", originLocationId: id(2), destinationLocationId: id(2) }).success).toBe(false);
  });
});

describe("tripSchema", () => {
  // A trip carries no organizationId: ownership is derived server-side from
  // the vehicle's and route's organization (see app/admin/trips/new), so the
  // client can never assert which organization a trip belongs to.
  const validTrip = { routeId: id(2), vehicleId: id(3), departureTime: "2026-09-20T08:00", arrivalTime: "2026-09-20T12:00", basePrice: 1200, status: "scheduled" };

  it("accepts chronological trip times", () => {
    expect(tripSchema.safeParse(validTrip).success).toBe(true);
  });
  it("rejects arrival before departure", () => {
    expect(tripSchema.safeParse({ ...validTrip, departureTime: "2026-09-20T12:00", arrivalTime: "2026-09-20T08:00" }).success).toBe(false);
  });
  it("requires basePrice, because booking and payment both price off it", () => {
    // trips.base_price is NOT NULL and create_seat_booking raises without it.
    const withoutPrice: Record<string, unknown> = { ...validTrip };
    delete withoutPrice.basePrice;
    expect(tripSchema.safeParse(withoutPrice).success).toBe(false);
  });
  it("rejects a negative fare", () => {
    expect(tripSchema.safeParse({ ...validTrip, basePrice: -1 }).success).toBe(false);
  });
  it("coerces a form-submitted string fare", () => {
    const parsed = tripSchema.safeParse({ ...validTrip, basePrice: "1200" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.basePrice).toBe(1200);
  });
});
