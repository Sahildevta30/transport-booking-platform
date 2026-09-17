import { describe, expect, it } from "vitest";
import { bookingRequestSchema, seatSelectionSchema } from "@/lib/validation/booking";

const tripId = "11111111-1111-4111-8111-111111111111";
const seatA = "22222222-2222-4222-8222-222222222222";
const seatB = "33333333-3333-4333-8333-333333333333";
const passenger = { fullName: "Test Passenger", phone: "9876543210" };

describe("booking validation", () => {
  it("accepts one unique seat per passenger", () => {
    expect(bookingRequestSchema.safeParse({ tripId, bookingMode: "SEAT_BOOKING", seatIds: [seatA], passengers: [passenger] }).success).toBe(true);
  });

  it("rejects duplicate seat selection", () => {
    expect(seatSelectionSchema.safeParse({ tripId, seatIds: [seatA, seatA] }).success).toBe(false);
  });

  it("rejects mismatched passenger and seat counts", () => {
    expect(bookingRequestSchema.safeParse({ tripId, bookingMode: "SEAT_BOOKING", seatIds: [seatA, seatB], passengers: [passenger] }).success).toBe(false);
  });

  it("accepts full vehicle booking without seat ids", () => {
    expect(bookingRequestSchema.safeParse({ tripId, bookingMode: "FULL_VEHICLE_BOOKING", seatIds: [], passengers: [passenger] }).success).toBe(true);
  });

  it("rejects individual seat ids for full vehicle booking", () => {
    expect(bookingRequestSchema.safeParse({ tripId, bookingMode: "FULL_VEHICLE_BOOKING", seatIds: [seatA], passengers: [passenger] }).success).toBe(false);
  });
});
