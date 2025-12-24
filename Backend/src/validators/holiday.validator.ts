import { z } from "zod";

export const createHolidaySchema = z.object({
  facilityId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});