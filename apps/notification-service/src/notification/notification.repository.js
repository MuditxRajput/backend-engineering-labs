import { prisma } from "@backend/database";

export const savedAsPendingStateInDb = async(tx,notification)=>{
  
      if(!notification){
        throw new Error("Notification payload missing");
     }
        return await tx.Notification.create({
            data: {
            userId: notification?.userId,
            recipient: notification?.recipient,
            event: notification.event,
            status: 'PENDING',
            orderId: notification?.orderId || null,
            channel: notification.channel,
            payload: notification.payload || null,
         }
        })
   
}

export const notificationSaveInOutBox = async(tx,notification)=>{
 
    if(!notification){
      throw new Error("Notification payload missing");
   }
    return await tx.Outbox.create({
        data:{
            notificationId : notification.id,
            status : 'PENDING',
        }
    })
  
}