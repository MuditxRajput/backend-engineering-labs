import connection from "../../../../packages/redis/redis.connection.js"

class Worker {
    constructor(queueName) {
        this.queueName = queueName;
        this.connection = connection;
        this.waitingKey = `bullmq:${this.queueName}:waiting`;
        this.activeKey = `bullmq:${this.queueName}:active`;
    }
    async moveToActive(jobId) {
        await this.connection.lpush(this.activeKey, jobId);
    }
    async fetchJobFromWaitingQueue() {

        const [key, jobId] = await this.connection.blpop(this.waitingKey, 0);

        // we get the job id from the waiting list...
        await this.moveToActive(jobId);
        // we need to put in the active queue , right now active queue code is not present in the queue classs...
        // fetch the job from the hash queue using the jobId.
        const jobKey = `bullmq:${this.queueName}:job:${jobId}`;
        const jobInfo = await this.connection.hgetall(jobKey);
        console.log(`This will return the jobInfo`);
        return jobInfo;
    }
    async exectueJob(jobInfo) {
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
        while (true) {
            // move the job in the active queue ...
            const jobInfo = await this.fetchJobFromWaitingQueue();
            // exectue the job..
            const response = await this.exectueJob(jobInfo);
            if (response.msg === 'Job execute success') {
                // move job to complete queue , as right now i don't make the conmplete queue...
            }
            else {
                // there we have to managae the retry mechanism...
            }
            // get the job info from the hash queue...
        }
    }
}

export default Worker;