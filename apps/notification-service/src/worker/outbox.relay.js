import { prisma } from "@backend/database";
import { notificationQueue } from "../queues/queue";
import { addJobInNotificationQueue } from "../notification/notification.queue";

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
    }
    }
   } catch (error) {
    throw new Error(error.message);
   }
}