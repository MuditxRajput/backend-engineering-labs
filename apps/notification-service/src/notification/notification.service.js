
import { prisma } from "../../../../packages/database/prisma.js"
import { notificationSaveInOutBox, savedAsPendingStateInDb } from "./notification.repository.js";
export const createNotificationService = async (notification) => {
   try {
       await prisma.$transaction(async(tx)=>{
         const notificationRecord = await savedAsPendingStateInDb(tx,notification);
         if(!notificationRecord){
            throw new Error("Notification save failed");
         }
         const outbox = await notificationSaveInOutBox(tx,notificationRecord);
         if(!outbox)
         {
            throw new Error("Outbox save failed");
         }
      });
      return { msg: "Notification accepted", success: true };
   } catch (error) {
    return {
         success: false,
            msg: error.message  
      }

   }
}
export const getNotificationService = async(id)=>{
    try {
      if(!id) return {msg:'Notificaiton id is missing',status : 400,success:false};
      const existingNotification = await prisma.Notification.findUnique({
         where : {
            id : id,
         },
         include :{
            outbox : true
         }
      });
      return {msg:`Notification info of ${id} `,info : existingNotification,success:200,success:true};
    } catch (error) {
      return {msg:error.message,success:false};
    }
}