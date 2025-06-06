// src/validators/user.schema.ts
import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["hr", "interviewer"]),
  organization: z.string(), // Can be name or ObjectId
  isNewOrg: z.boolean().optional(),
});

