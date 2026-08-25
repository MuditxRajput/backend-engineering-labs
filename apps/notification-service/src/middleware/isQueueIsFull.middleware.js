// import { prisma } from "@backend/database";
// import { notificationQueue } from "../queues/queue.js"

// export const isQueueIsFull =async(req,res,next)=>{
//   try {
    
//     const pendingReqCount = await prisma.$queryRaw`
//     SELECT "notificationId" FROM "Outbox" 
//     WHERE STATUS ='PENDING'
//     FOR UPDATE
//     `
//     if(pendingReqCount.length>20000) return res.set({"Retry-after":5}).status(429).json({msg:'Queue is full'})
//       next();
//   } catch (error) {
//     return res.status(500).json({msg:error.message,success:false});
//   }
// }