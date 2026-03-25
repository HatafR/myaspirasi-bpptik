import { z } from "zod";

export const ticketSchema = z.object({
  name: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  email: z.email(),
  subject: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(2000),
  serviceId: z.uuid(),
});
