import { payment_create_service } from "./service.js";

export const payment_create_controller = async (req, res) => {
    try {
        const { orderId, customerId, amount, currency, idempotencyKey } = await req.body;
        // validate all the inputs coming from the other services..
        // but for now we trust the inputs..
        const response = await payment_create_service({ orderId, customerId, amount, currency, idempotencyKey });
    } catch (error) {

    }
}