import { z } from "zod";
export const createSlotTemplateSchema = z
  .object({
    facilityId: z.string().uuid(),
    slotType: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
    startTime: z.string(),
    endTime: z.string(),
    capacity: z.number().min(1),

    price1Day: z.number().min(1).optional(),
    price3Day: z.number().min(1).optional(),
    price7Day: z.number().min(1).optional(),

    validFrom: z.string(),
    validTill: z.string(),
  })
  .refine(
    (data) =>
      data.price1Day ||
      data.price3Day ||
      data.price7Day,
    {
      message: "At least one pass price must be provided",
      path: ["price1Day"],
    }
  );
