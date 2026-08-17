import { prisma } from "@backend/database";
import { notificationQueue } from "../queues/queue.js";
import { addJobInNotificationQueue } from "../notification/notification.queue.js";

// fetch all the jobid whose status is pending..
const addNoticationInQueue = async (records) => {
   try {
   const results =  await Promise.all(records.map((r)=>{
        return addJobInNotificationQueue(r.notificationId);
    }));

    // console.log("this is results",results);
    const successfullIds = results.map((result,index)=>result.success?  records[index].notificationId: null).filter(Boolean);
    if(successfullIds.length>0)
    {
        await prisma.Outbox.updateMany({
            where:{
                notificationId:{
                    in : successfullIds
                }
            },
            data:{
                status : 'PROCESSED'
            }
        })
    }
   } catch (error) {
    console.log(error.message);
     return {error:error.message}
   }
}

export const outboxWorker =async()=>{
   try {
    let pendingRecords
    await prisma.$transaction(async(tx)=>{
         pendingRecords = await tx.$queryRaw`
        SELECT "notificationId" FROM "Outbox"
        WHERE status ='PENDING'
        ORDER BY id ASC
        LIMIT 100
        FOR UPDATE SKIP LOCKED
     `
     for (const job of pendingRecords)
     {
        // const response =  await addJobInNotificationQueue(job.notificationId);
        // if( response?.success){
         await tx.Outbox.update({
             where: {
                 notificationId : job.notificationId
             },
             data:{
                 status : 'PROCESSING',
             }
         })
     }  
    });
    // console.log("pending records:",pendingRecords);
    // console.log("count:",pendingRecords.length);
    await addNoticationInQueue(pendingRecords);  
   } catch (error) {
    throw new Error(error.message);
   }
}