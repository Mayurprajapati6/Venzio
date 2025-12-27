import { z } from "zod";

// No request body validation needed for payment creation endpoints
// They use path parameters (bookingId) or no parameters (subscription)

// Webhook payload validation (basic structure)
export const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        status: z.string(),
        method: z.string().optional(),
      }),
    }),
  }),
});

