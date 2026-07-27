import { prisma } from "../../../../packages/database/prisma.js"
import { addJobInNotificationQueue } from "./notification.queue.js";
import { notificationSaveInOutBox, savedAsPendingStateInDb } from "./notification.repository.js";
export const createNotificationService = async (notification) => {
   try {

      const savedAsPendingState = await savedAsPendingStateInDb(notification);
      console.log('saveAsPendingState',savedAsPendingState);
      if (!savedAsPendingState?.id) {
         return { msg: 'Error in saving the data in the notification table ', success: false }
      }
      // if the data is successfully saved we have to add in the job in the queue ...
      const response = await addJobInNotificationQueue(savedAsPendingState?.id);
      if (!response.success) {
         // apply outbox pattern
         console.log('yes i am inside the if');
         
         const responseFromOutBox = await notificationSaveInOutBox(savedAsPendingState);
         console.log('responseFromOutBox',responseFromOutBox);
         
         return { msg: response.msg, success: false };
      }
      return { msg: response.msg, success: true };
   } catch (error) {
    return {
         success: false,
            msg: error.message  
      }

   }
}