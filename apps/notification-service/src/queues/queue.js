import {Queue} from 'bullmq'
import connection from '../../../../packages/redis/redis.connection.js'
export const notificationQueue = new Queue("notification",{connection});
