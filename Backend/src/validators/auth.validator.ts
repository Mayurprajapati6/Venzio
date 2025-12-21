import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().min(10),
  role: z.enum(["ADMIN", "OWNER", "USER"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
