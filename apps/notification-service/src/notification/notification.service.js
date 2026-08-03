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