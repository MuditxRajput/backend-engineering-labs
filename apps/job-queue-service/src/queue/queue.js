import connection from '../../../../packages/redis/redis.connection.js'
class Queue {
    constructor(name,{maxAttempts=3}={}) {
        this.name = name;
        this.connection = connection;
        this.waitingKey = `bullmq:${this.name}:waiting`
        this.activeKey = `bullmq:${this.name}:active`
        this.completeKey = `bullmq:${this.name}:complete`
        this.failedKey = `bullmq:${this.name}:failed`
        this.maxAttempts = maxAttempts;
    }

    async add(job) {
        const jobKey = `bullmq:${this.name}:job:${job.id}`;
        await this.connection.hset(jobKey, {
            id: job.id,
            type: job.type,
            payload: JSON.stringify(job.payload),
            status: 'WAITING',
            maxAttempts : job.maxAttempts ??  this.maxAttempts,
            attemptsMade : 0

        });
        await this.connection.lpush(this.waitingKey, job.id);

        console.log(`Job added : ${job.id}`);
        return job.id;
    }


}

export default Queue;