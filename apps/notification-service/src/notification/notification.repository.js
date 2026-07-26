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