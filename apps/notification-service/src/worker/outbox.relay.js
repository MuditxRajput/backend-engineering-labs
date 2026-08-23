import { prisma } from "@backend/database";
import { notificationQueue } from "../queues/queue.js";
import { addJobInNotificationQueue } from "../notification/notification.queue.js";

// fetch all the jobid whose status is pending..
const addNoticationInQueue = async (records,workerId) => {
    try {
        const results = await Promise.all(records.map((r) => {
            return addJobInNotificationQueue(r.notificationId);
        }));
        const processedStart = performance.now();
        const successfullIds = results.map((result, index) => result.success ? records[index].notificationId : null).filter(Boolean);
//         console.log(
//     `[${workerId}] PROCESSING → PROCESSED`,
//     successfullIds
// );
        if (successfullIds.length > 0) {
            await prisma.Outbox.updateMany({
                where: {
                    notificationId: {
                        in: successfullIds
                    }
                },
                data: {
                    status: 'PROCESSED'
                }
            })
        }
        const processedTime =
            performance.now() - processedStart;

        console.log(
            `[OUTBOX] DB PROCESSING → PROCESSED: ${processedTime.toFixed(2)} ms`
        );
    } catch (error) {
        console.error(error.message);
        return { error: error.message }
    }
}

export const outboxWorker = async (workerId) => {
    const totalStart = performance.now();
    try {
        let pendingRecords
        const dbstart = performance.now();
        await prisma.$transaction(async (tx) => {
            pendingRecords = await tx.$queryRaw`
        SELECT "notificationId" FROM "Outbox"
        WHERE status ='PENDING'
        ORDER BY id ASC
        LIMIT 100
        FOR UPDATE SKIP LOCKED
     `
    //   console.log(
    //             `[${workerId}] SELECTED`,
    //             pendingRecords.map(x => x.notificationId)
    //         );
            const updateStart = performance.now();
            const ids = pendingRecords?.map((val)=>val.notificationId);
            await tx.Outbox.updateMany({
                where:{
                    notificationId:{
                        in : ids
                    }
                },
                data:{
                    status : 'PROCESSING'
                }
            })
            // for (const job of pendingRecords) {
            //     // const response =  await addJobInNotificationQueue(job.notificationId);
            //     // if( response?.success){
            //     await tx.Outbox.update({
            //         where: {
            //             notificationId: job.notificationId
            //         },
            //         data: {
            //             status: 'PROCESSING',
            //         }
            //     })
            // }
            console.log(
                `[${workerId}] UPDATE TIME`,
                performance.now() - updateStart
            );
            const updateTime = performance.now() - updateStart;

            console.log(
                `[OUTBOX] 100 Update many: ${updateTime.toFixed(2)} ms`
            );
        });
        const dbTime = performance.now() - dbstart;
        console.log(
            `[OUTBOX] DB PENDING → PROCESSING: ${dbTime.toFixed(2)} ms`
        );

        const queueStart = performance.now();
        await addNoticationInQueue(pendingRecords,workerId);
        const queueTime = performance.now() - queueStart;

        console.log(
            `[OUTBOX] BullMQ add jobs: ${queueTime.toFixed(2)} ms`
        );

        const totalTime = performance.now() - totalStart;

        console.log(
            `[OUTBOX] TOTAL: ${totalTime.toFixed(2)} ms`
        );

    } catch (error) {
        throw new Error(error.message);
    }
}





//
