import { prisma } from "@backend/database";

import { notificationQueue } from "../queues/queue.js";

import { addJobInNotificationQueue } from "../notification/notification.queue.js";

// fetch all the jobid whose status is pending..

const addNoticationInQueue = async (records, workerId) => {
    try {
        const results = await Promise.all(
            records.map((r) => {
                return addJobInNotificationQueue(r.notificationId);
            })
        );

        const successfullIds = results
            .map((result, index) =>
                result.success ? records[index].notificationId : null
            )
            .filter(Boolean);

        if (successfullIds.length > 0) {
            const processedStart = performance.now();

            await prisma.Outbox.updateMany({
                where: {
                    notificationId: {
                        in: successfullIds,
                    },
                },
                data: {
                    status: "PROCESSED",
                },
            });

            const processedTime = performance.now() - processedStart;

            console.log(
                `[OUTBOX] DB PROCESSING → PROCESSED: ${processedTime.toFixed(2)} ms`
            );
        }
    } catch (error) {
        console.error(error.message);
        return { error: error.message };
    }
};

export const outboxWorker = async (workerId) => {
    const totalStart = performance.now();

    try {
        let pendingRecords;

        const dbStart = performance.now();

        await prisma.$transaction(async (tx) => {
            const transactionStart = performance.now();

            pendingRecords = await tx.$queryRaw`
                SELECT "notificationId"
                FROM "Outbox"
                WHERE status = 'PENDING'
                ORDER BY id ASC
                LIMIT 100
                FOR UPDATE SKIP LOCKED
            `;

            const selectTime = performance.now() - transactionStart;

            console.log(
                `[OUTBOX-WORKER-${workerId}] SELECT + LOCK: ${selectTime.toFixed(2)} ms`
            );

            const updateStart = performance.now();

            const ids = pendingRecords?.map(
                (val) => val.notificationId
            );

            await tx.Outbox.updateMany({
                where: {
                    notificationId: {
                        in: ids,
                    },
                },
                data: {
                    status: "PROCESSING",
                },
            });

            const updateTime = performance.now() - updateStart;

            console.log(
                `[OUTBOX-WORKER-${workerId}] UPDATE TIME: ${updateTime.toFixed(2)} ms`
            );

            const transactionTime = performance.now() - transactionStart;

            console.log(
                `[OUTBOX-WORKER-${workerId}] TRANSACTION TIME: ${transactionTime.toFixed(2)} ms`
            );
        });

        const dbTime = performance.now() - dbStart;

        console.log(
            `[OUTBOX] DB PENDING → PROCESSING: ${dbTime.toFixed(2)} ms`
        );

        const queueStart = performance.now();

        await addNoticationInQueue(pendingRecords, workerId);

        const queueTime = performance.now() - queueStart;

        console.log(
            `[OUTBOX] PROCESSING → QUEUE COMPLETE: ${queueTime.toFixed(2)} ms`
        );

        const totalTime = performance.now() - totalStart;

        console.log(
            `[OUTBOX] TOTAL: ${totalTime.toFixed(2)} ms`
        );

    } catch (error) {
        throw new Error(error.message);
    }
};