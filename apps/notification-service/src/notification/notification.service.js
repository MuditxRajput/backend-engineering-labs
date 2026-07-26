import { prisma } from "../../../../packages/database/prisma"


// 
export const createNotificationService=async(notification)=>{
   try {
    const savedAsPendingState = await prisma.Notification.create({
       data:{
         userId : notification?.userId,
         recipient : notification?.recipient,
         event : notification.event,
         status : 'Pending',
         orderId : notification?.orderId || null,
         channel : notification.channel,
         payload : notification.payload || null,
         errorMessage : notification.errorMessage || null,
         sentAt : null,
       }    
    });
    if(!savedAsPendingState){
        return {msg:'Error in saving the data in pending state',success:false}
    }
    // if the data is successfully saved we have to add in the job in the queue ...
    
   } catch (error) {
    
   }
}