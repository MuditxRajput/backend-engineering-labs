import { Worker } from "bullmq";
import connection from "../../../../packages/redis/redis.connection.js";
import { prisma } from "@backend/database";

import { sendEmail } from "./sendEmail.worker.js";
import { allowedResend } from "../../../../packages/redis/rate-limiter.js";
export const notificationWorker = new Worker('notification',async (job)=>{
    try {
        const jobId = job.data;
        const existedNotification = await prisma.Notification.findUnique({
            where:{
                id : jobId
            }
        });
        if(!existedNotification) throw new Error('No notificatin exist')
        if(existedNotification.status==='SENT') return;
        const allowed = await allowedResend();
        if(!allowed)
        {
            throw new Error('Rate limit exceed');
        }
        const channel = existedNotification?.channel;
        const event = existedNotification?.event;

        // we need to update the notification table with status as processing
        const updateNotificationTbl = await prisma.Notification.update({
            where : {
                id : jobId,
            },
            data:{
                status : 'PROCESSING',
            }
        })
        if(channel=='EMAIL')
        {
            // PROCESSED IN EMAIL LIKE SEND VIA RESEND...
            if(event=='PAYMENT_SUCCESS')
            {
                const responseFromResend = await sendEmail('Payment success');
                if(responseFromResend.success)
                {
                    // update the notification table as status 
                    const updateNotificationTable = await prisma.Notification.update({
                        where : {
                            id : jobId,
                        },
                        data:{
                            status : 'SENT',
                        }
                    })
                }
                else{
                    throw new Error('Resend failed');
                }
            }
            else{
                const responseFromResend = await sendEmail('Payment failed');
                if(responseFromResend.success)
                {
                    const updateNotificationTable = await prisma.Notification.update({
                        where : {
                            id : jobId,
                        },
                        data:{
                            status : 'FAILED',
                        }
                    })
                }
                else{
                    throw new Error('Resend failed');
                }
            }
        }
    //    return {msg:'Hey i am worker and i get the job'}
    } catch (error) {
        console.log(`Error in notification worker `,error.message);
        throw new Error(error.message);
    }
},{connection})
