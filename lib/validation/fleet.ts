import { z } from "zod";

export const vehicleSchema = z.object({
  organizationId: z.string().uuid(),
  vehicleTypeId: z.string().uuid(),
  label: z.string().trim().min(2).max(120),
  registrationNumber: z.string().trim().min(4).max(40).transform((value) => value.toUpperCase()),
  seatCapacity: z.union([z.literal(""), z.coerce.number().int().min(1).max(200)]).transform((value) => value === "" ? null : value),
  status: z.enum(["active", "maintenance", "inactive"]),
});

export const seatBatchSchema = z.object({
  vehicleId: z.string().uuid(),
  prefix: z.string().trim().min(1).max(4).regex(/^[A-Za-z0-9]+$/),
  count: z.coerce.number().int().min(1).max(100),
  seatType: z.string().trim().max(40).optional().default("standard"),
});
