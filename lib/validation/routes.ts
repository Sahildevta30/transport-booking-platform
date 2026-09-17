import { z } from "zod";

export const routeSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  originLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  distanceKm: z.coerce.number().positive().max(10000).nullable().optional(),
}).refine((value) => value.originLocationId !== value.destinationLocationId, {
  message: "Origin and destination must be different",
  path: ["destinationLocationId"],
});

export const tripSchema = z.object({
  routeId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  departureTime: z.string().min(1),
  arrivalTime: z.string().min(1),
  basePrice: z.coerce.number().nonnegative().max(10000000),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
}).refine((value) => new Date(value.arrivalTime).getTime() > new Date(value.departureTime).getTime(), {
  message: "Arrival must be after departure",
  path: ["arrivalTime"],
});
