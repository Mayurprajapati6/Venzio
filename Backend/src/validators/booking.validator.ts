// src/modules/booking/booking.validator.ts
import { z } from "zod";

export const createBookingSchema = z.object({
  facilityId: z.string().uuid({
    message: "facilityId must be a valid UUID",
  }),

  slotType: z.enum(["MORNING", "AFTERNOON", "EVENING"], {
    required_error: "slotType is required",
  }),

  passDays: z.union([z.literal(1), z.literal(3), z.literal(7)], {
    errorMap: () => ({ message: "passDays must be 1, 3, or 7" }),
  }),

  startDate: z.string().refine(
    (d) => !isNaN(Date.parse(d)),
    { message: "startDate must be a valid ISO date" }
  ),
});
