import e from "express";
import connection from "../../../../packages/redis/redis.connection.js"

class Worker {
    constructor(queueName) {
        this.queueName = queueName;
        this.connection = connection;
        this.waitingKey = `bullmq:${this.queueName}:waiting`;
        this.activeKey = `bullmq:${this.queueName}:active`;
        this.completeKey = `bullmq:${this.queueName}:complete`;
        this.failedKey = `bullmq:${this.queueName}:failed`;
    }

    async hashQueueChangeStatus(jobId, val) {
        const jobKey = `bullmq:${this.queueName}:job:${jobId}`;
        await this.connection.hset(jobKey, 'status', val);
    }

    async moveToActive() {
        const jobId = await this.connection.brmove(
            this.waitingKey,
            this.activeKey,
            'RIGHT',
            'LEFT',
            0
        );
        await this.hashQueueChangeStatus(jobId, 'ACTIVE');
        // we need to put in the active queue , right now active queue code is not present in the queue classs...

        return { jobId };
    }

    async executeJob(jobInfo) {
        // exectue the job..
        const { type } = jobInfo;
        let flag = false;
        if (type === 'GENERATE_REPORT') {
            console.log(`we are executinig the job as sample`);

            flag = true;
        }
        if (flag) {
            return { msg: 'Job execute success' }
        }
        return { msg: 'error' };
    }
    async getJobInfoFromHash(jobId) {
        const jobKey = `bullmq:${this.queueName}:job:${jobId}`;
        const jobInfo = await this.connection.hgetall(jobKey);
        return { jobInformation: jobInfo, jobId }
    }
    async decideFn(response, jobId) {
        if (response.msg === 'Job execute success') {
            // move job to complete queue , as right now i don't make the conmplete queue...
            await this.connection.rpop(this.activeKey);
            // add in the complete queue...
            await this.connection.lpush(this.completeKey, jobId);
            await this.hashQueueChangeStatus(jobId, 'COMPLETED');
            const jobInformation = await this.connection.hgetall(jobId);
            jobInformation.attemptsMade = jobInformation.attemptsMade + 1;
            await this.connection.hset(`bullmq:${this.queueName}:job:${jobId}`, jobInformation);
        }
        else {
            // there we have to managae the retry mechanism...
            await this.connection.lrem(this.activeKey, 1, jobId);
            await this.connection.lpush(this.waitingKey, jobId);
            // await this.hashQueueChangeStatus(jobId, 'FAILED')
        }
    }
    async recoverActiveJobs() {
        while (true) {
            let response;
            // const stalledJobId = await this.connection.rpop(this.activeKey);
            // if (!stalledJobId) return;
            // const { jobInformation, jobId } = await this.getJobInfoFromHash(stalledJobId);
            // if (Number(jobInformation?.attemptsMade) < Number(jobInformation?.maxAttempts) - 1) {
            //     response = await this.executeJob(jobInformation);
            //     await this.decideFn(response, jobId);
            // }
            // else {
            //     this.connection.rpop(this.activeKey, 1, jobId);
            //     this.connection.lpush(this.failedKey, jobId);
            //     this.hashQueueChangeStatus(jobId, 'FAILED')
            // }
            const stalledJobId = await this.connection.lrange(
                this.activeKey, 0, -1
            );
            for (const jobId of stalledJobId) {
                const { jobInformation } = await this.getJobInfoFromHash(jobId);

            }
        }
    }
    async run() {
        console.log(`Worker is running...`);
        let response;
        while (true) {
            // move the job in the active queue ...


            //recovery code to check the previous active code...
            await recoverActiveJobs();
            const { jobId } = await this.moveToActive();
            const getJobIdFromActiveQueue = await this.connection.lindex(this.activeKey, -1);
            const { jobInformation } = await this.getJobInfoFromHash(getJobIdFromActiveQueue);
            if (Number(jobInformation?.attemptsMade) < Number(jobInformation?.maxAttempts) - 1) {
                response = await this.executeJob(jobInformation);
                await this.decideFn(response);
            }
            else {
                // add the job in the failed queue...
                this.connection.rpop(this.activeKey, 1, jobId);
                this.connection.lpush(this.failedKey, jobId);
                this.hashQueueChangeStatus(jobId, 'FAILED');
            }
            // get the job info from the hash queue...
        }
    }
}

export default Worker;