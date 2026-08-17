import { prisma } from "@backend/database";
export const recoveryOutboxWorker = async()=>{
    try {
        await prisma.$transaction(async(tx)=>{
          const processedData = await tx.Outbox.findMany({
            where:{
                status:'PROCESSING',
                updatedAt : {
                    lt: new Date(Date.now()-5*60*1000)
                }
            }
          });
          const ids = processedData?.map((val)=>val.notificationId);
          if(ids.length>0)
          {
              await tx.Outbox.updateMany({
                where:{
                    notificationId:{
                        in : ids
                    }
                },
                data:{
                    status : "PENDING"
                }
              })
          }
        })
    } catch (error) {
        console.log(error.message);
    }
}