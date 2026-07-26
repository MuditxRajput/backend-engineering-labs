import { z } from "zod";

export const payloadValidation = z.object({
  userId: z.number(),

  recipient: z.string(),

  event: z.enum([
    "PAYMENT_SUCCESS",
    "ONBOARDING_WELCOME",
    "PAYMENT_FAILED",
    "FORGET_PASSWORD",
    "RESET_PASSWORD",
    "ORDER_INVOICE",
    "ORDER_PLACED",
    "ORDER_CANCELLED",
    "ORDER_DELAYED",
  ]),

  orderId: z.number().optional(),

  channel: z.enum([
    "EMAIL",
    "SMS",
    "WHATSAPP",
  ]),

  payload: z.record(z.string(), z.any()).optional(),
});