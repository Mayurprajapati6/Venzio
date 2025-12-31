import { z } from "zod";

export const createReviewSchema = z.object({
  bookingId: z.string().uuid({
    message: "bookingId must be a valid UUID",
  }),
  rating: z
    .number()
    .int()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
  comment: z
    .string()
    .max(1000, { message: "Comment must be at most 1000 characters" })
    .optional(),
});

