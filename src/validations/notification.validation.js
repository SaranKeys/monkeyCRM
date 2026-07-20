import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().url("Invalid notification endpoint"),
    keys: z.object({
      p256dh: z.string().min(1, "p256dh key is required"),
      auth: z.string().min(1, "auth key is required")
    })
  })
});