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

    async fetchJobFromWaitingQueue() {
        const jobId = await this.connection.blmove(
            this.waitingKey,
            this.activeKey,
            'LEFT',
            'RIGHT',
            0
        );
        await this.hashQueueChangeStatus(jobId, 'ACTIVE');
        // we need to put in the active queue , right now active queue code is not present in the queue classs...
        // fetch the job from the hash queue using the jobId.
        const jobKey = `bullmq:${this.queueName}:job:${jobId}`;
        const jobInfo = await this.connection.hgetall(jobKey);
        return { jobInfo, jobId, maxAttempts };
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

    async run() {
        console.log(`Worker is running...`);
        while (true) {
            // move the job in the active queue ...
            const { jobInfo, jobId, maxAttempts, attemptsMade } = await this.fetchJobFromWaitingQueue();
            // exectue the job..
            let response;
            try {
                if (attemptsMade < maxAttempts) {
                    response = await this.executeJob(jobInfo);
                    if (response.msg === 'Job execute success') {
                // move job to complete queue , as right now i don't make the conmplete queue...
                await this.connection.lrem(this.activeKey, 1, jobId);
                // add in the complete queue...
                await this.connection.lpush(this.completeKey, jobId);
                await this.hashQueueChangeStatus(jobId, 'COMPLETED')

            }
            else {
                // there we have to managae the retry mechanism...
                await this.connection.lrem(this.activeKey, 1, jobId);
                await this.connection.lpush(this.waitingKey, jobId);
                // await this.hashQueueChangeStatus(jobId, 'FAILED')
            }
                }
                else {
                    // again we have to move the job in the waiting queue...
                    this.connection.lrem(this.activeKey, 1, jobId);
                    this.connection.lpush(this.failedKey, jobId);
                    this.hashQueueChangeStatus(jobId,'FAILED')
                }
            } catch (error) {
                console.log(error.message);
                
            }
            finally{
                // await this.connection.hset(`bullmq:${this.queueName}:job:${jobId}`,'attemptsMade',)
              const jobInformation =   await this.connection.hgetall(jobId);
              jobInformation.attemptsMade = jobInformation.attemptsMade+1;
              await this.connection.hset(`bullmq:${this.queueName}:job:${jobId}`,jobInformation);


            }

            
            // get the job info from the hash queue...
        }
    }
}

export default Worker;