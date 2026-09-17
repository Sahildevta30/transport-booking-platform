import { z } from "zod";

export const seatSelectionSchema = z.object({
  tripId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()).min(1).max(50),
}).superRefine((value, ctx) => {
  if (new Set(value.seatIds).size !== value.seatIds.length) {
    ctx.addIssue({ code: "custom", message: "Duplicate seats are not allowed", path: ["seatIds"] });
  }
});

export const passengerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
});

export const bookingRequestSchema = z.object({
  tripId: z.string().uuid(),
  bookingMode: z.enum(["SEAT_BOOKING", "FULL_VEHICLE_BOOKING"]),
  seatIds: z.array(z.string().uuid()).max(50).default([]),
  passengers: z.array(passengerSchema).min(1).max(50),
}).superRefine((value, ctx) => {
  if (value.bookingMode === "SEAT_BOOKING" && value.seatIds.length !== value.passengers.length) {
    ctx.addIssue({ code: "custom", message: "Each passenger requires exactly one selected seat", path: ["seatIds"] });
  }
  if (value.bookingMode === "FULL_VEHICLE_BOOKING" && value.seatIds.length > 0) {
    ctx.addIssue({ code: "custom", message: "Full-vehicle bookings must not submit individual seat IDs", path: ["seatIds"] });
  }
  if (new Set(value.seatIds).size !== value.seatIds.length) {
    ctx.addIssue({ code: "custom", message: "Duplicate seats are not allowed", path: ["seatIds"] });
  }
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;
