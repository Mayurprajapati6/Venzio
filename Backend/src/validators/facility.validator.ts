import { z } from "zod";

export const createFacilitySchema = z.object({
  categoryId: z.number(),
  name: z.string().min(3),
  city: z.string(),
  state: z.string(),
  address: z.string(),
  amenities: z.array(z.string()),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});
