import { prisma } from "@backend/database"
import { deadNotificationQueue } from "../queues/queue.js"
export const dlqRecovery = async()=>{
  try {
        const pendingDLQ = await prisma.$queryRaw`
        SELECT id from "Notification"
        where "dlqStatus" = 'PENDING' AND "status" = 'FAILED'
        LIMIT 100
        `
  const response =  await Promise.allSettled(pendingDLQ.map((n)=>deadNotificationQueue.add('dlq-noptification',n.id,{
        jobId : `Notification-${n.id}`
    })))
    const successIds = response.map((result,index)=>{
        if(result.status==='fulfilled') return Number(pendingDLQ[index].id);
        const msg = result.reason?.message || "";
        if(msg.includes('already exists')) return Number(pendingDLQ[index].id);

        return null;
    }).filter(Boolean);
    if(successIds.length>0)
    {
        await prisma.Notification.updateMany({
            where:{
                id:{in : successIds}
            },
            data:{dlqStatus : 'COMPLETE'}
        })
    }
    
  } catch (error) {
    console.log(error.message);

  }
}