import { prisma } from "@backend/database"

export const worker = async()=>{
    try {
        // right now we have only one worker 
        // worker fetch the job from the transcation table where the status is pending with limit 10.
        // make a transcation for locking the row using skip row ..
        const response = await prisma.$transaction(async(tx)=>{
         const pendingPayment =    await tx.Transaction.$queryRaw`
            select "paymentId" from Transcation 
            where "status" = 'PENDING'
            limit 10
            FOR UPDATE SKIP LOCKED
            `
        
        // now change the status from pending to processing
        for(const id of pendingPayment)
        {
            await tx.Transaction.upate({
                where : {
                    id,
                },
                data:{
                    status : 'PROCESSING'
                }
            })
        }
        // send the array of pendingPayment to provider..
    })
    } catch (error) {
        throw error;
    }

}