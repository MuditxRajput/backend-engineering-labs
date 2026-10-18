import connection from "../../../../packages/redis/redis.connection.js"

class Worker {
    constructor(queueName)
    {
        this.queueName = queueName;
        this.connection = connection;
         this.waitingKey = `bullmq:${this.queueName}:waiting`;
        this.activeKey = `bullmq:${this.queueName}:active`;
    }

   async fetchJobFromWaitingQueue()
   {
      while(true)
      {
       const jobId = await this.connection.blpop(this.waitingKey);
       // we get the job id from the waiting list...
       // we need to put in the active queue , right now active queue code is not present in the queue classs...
      }
   }
}

export default Worker;