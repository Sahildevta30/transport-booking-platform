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
  it("accepts chronological trip times", () => {
    expect(tripSchema.safeParse({ organizationId: id(1), routeId: id(2), vehicleId: id(3), departureTime: "2026-09-20T08:00", arrivalTime: "2026-09-20T12:00", status: "scheduled" }).success).toBe(true);
  });
  it("rejects arrival before departure", () => {
    expect(tripSchema.safeParse({ organizationId: id(1), routeId: id(2), vehicleId: id(3), departureTime: "2026-09-20T12:00", arrivalTime: "2026-09-20T08:00", status: "scheduled" }).success).toBe(false);
  });
});
