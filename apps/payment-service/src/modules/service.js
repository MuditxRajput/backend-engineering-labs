import prisma from '@backend/database';
export const payment_create_service = async ({ orderId, customerId, amount, currency, idempotencyKey }) => {
    try {
        // save the info in the database....
        // check is this payment is already present with same idempotecy key??
        const existingPayment = await prisma.Payment.findUnique({
            where: { idempotencyKey },
        });
        if (existingPayment) {
            if (orderId != existingPayment.orderId && customerId != existingPayment.customerId && amount != existingPayment.amount) throw new Error('Duplicate idempotecy key');
            return existingPayment;
        }
        const response = await prisma.$transaction(async (tx) => {
            // tackle the race condition if 2 req read that idempotecy key is not present...
            // await tx.$queryRaw`SELECT "idempotecyKey" from Payment where ide`
            const payment = await tx.Payment.create({
                data: {
                    orderId,
                    customerId,
                    amount,
                    currency,
                    idempotencyKey,
                }

            })
            const transcation = await tx.Transcation.create({
                data: {
                    paymentId: payment.id,
                }

            })
            return { paymentId: payment.id, transcationId: transcation.id, status: 'PENDING' };
        });
        return response.msg;
    } catch (error) {
        // throw error;
        // check the error code , if the row is already present .. we get the result from db and return if not then return the error.
        if (error.code === 'p2002') {
            // row is already exist...
            const response = await prisma.Payment.findUnique({
                where: {
                    idempotencyKey
                },
                include: {
                    transcation: true,
                }
            });
            // if()

        }
        throw error;
    }
}