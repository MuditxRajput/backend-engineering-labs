import { prisma } from "@backend/database";
import { notificationQueue } from "../queues/queue.js";
import { addJobInNotificationQueue } from "../notification/notification.queue.js";

// fetch all the jobid whose status is pending..
export const  outboxWorker =async()=>{
   try {
    const pendingRecords = await prisma.Outbox.findMany({
        where : {
            status : 'PENDING',
        }
    });
    for (const job of pendingRecords)
    {
       const response =  await addJobInNotificationQueue(job.notificationId);
       if( response?.success){
        await prisma.Outbox.update({
            where: {
                notificationId : job.notificationId
            },
            data:{
                status : 'PROCESSED',
            }
        })
        console.log('Job is added in the queue successfully');
        
    }
    }
   } catch (error) {
    throw new Error(error.message);
   }
}