import { describe, expect, it } from "vitest";
import { seatBatchSchema, vehicleSchema } from "@/lib/validation/fleet";

describe("fleet validation", () => {
  it("normalizes registration numbers", () => {
    const result = vehicleSchema.parse({ organizationId: "11111111-1111-4111-8111-111111111111", vehicleTypeId: "22222222-2222-4222-8222-222222222222", label: "City Express", registrationNumber: "od14 ab 1234", seatCapacity: "40", status: "active" });
    expect(result.registrationNumber).toBe("OD14 AB 1234");
    expect(result.seatCapacity).toBe(40);
  });
  it("rejects invalid capacity", () => {
    expect(vehicleSchema.safeParse({ organizationId: "11111111-1111-4111-8111-111111111111", vehicleTypeId: "22222222-2222-4222-8222-222222222222", label: "Bus", registrationNumber: "OD14AB1234", seatCapacity: "0", status: "active" }).success).toBe(false);
  });
  it("limits generated seat batches", () => {
    expect(seatBatchSchema.safeParse({ vehicleId: "11111111-1111-4111-8111-111111111111", prefix: "A", count: 101, seatType: "standard" }).success).toBe(false);
  });
});
