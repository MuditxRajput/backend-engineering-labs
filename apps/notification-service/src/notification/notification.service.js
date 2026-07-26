import { prisma } from "../../../../packages/database/prisma.js"
import { addJobInNotificationQueue } from "./notification.queue.js";
import { savedAsPendingStateInDb } from "./notification.repository.js";
export const createNotificationService = async (notification) => {
   try {

      const savedAsPendingState = await savedAsPendingStateInDb(notification);
      console.log('saveAsPendingState',savedAsPendingState);
      
      if (!savedAsPendingState) {
         return { msg: 'Error in saving the data in pending state', success: false }
      }
      // if the data is successfully saved we have to add in the job in the queue ...
      const response = await addJobInNotificationQueue(savedAsPendingState?.id);
      if (!response.success) {
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