import { z } from "zod";

export const validation = z.object({
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

export const payloadValidation = (req,res,next)=>{
   try {
   const response =  validation.safeParse(req.body);
   if(response.data)
   {
     return next();
   }
   return res.status(400).json({
    msg: "validation failed",
    success: false,
    errors: response.error.issues, // optional
  });
   } catch (error) {
    return res.status(500).json({ msg: error.message, success: false });
   }
}