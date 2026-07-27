import { prisma } from "@backend/database";

export const savedAsPendingStateInDb = async(notification)=>{
    try {
        if(!notification) return {msg:'Notification data is missing',success:false};
        return await prisma.Notification.create({
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
    } catch (error) {
        return {error:error.message,success:false};
    }
}

export const notificationSaveInOutBox = async(notification)=>{
  try {
    if(!notification) return {msg:'Notification is missing in outbox table',success:true};
    return await prisma.Outbox.create({
        data:{
            notificationId : notification.id,
            status : 'PENDING',
        }
    })
  } catch (error) {
    return {error:`Error in outbox ${error.message}`,success:false};
  }
}