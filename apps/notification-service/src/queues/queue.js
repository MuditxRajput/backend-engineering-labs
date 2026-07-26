import {Queue} from 'bullmq'
import connection from '../../../../packages/redis/redis.connection'
const notificationQueue = new Queue("notification",{connection});
