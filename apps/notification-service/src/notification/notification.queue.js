import { notificationQueue } from "../queues/queue.js"
export const addJobInNotificationQueue = async (notificationId) => {
    try {
        
        if(!notificationId) return {msg:'NotificationId is missing',success:false};
        console.log('this is payload... which is added in the queue', notificationId);
        const response = await notificationQueue.add("send-notification", notificationId,{
            jobId : `notification-${notificationId}`
        });
        // if (!response) return { msg: 'Error in saving the job in the notification queue', success: false };
        return { msg: 'Job added successfully in notification queue', success: true };
    } catch (error) {
        const msg = error.message || "";
        if(msg.includes('already exists'))
        {
            return {msg:'Job alreay present',success:true};
        }

        return {msg:error.message,success:false};
    }
}