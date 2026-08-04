import Redis from 'ioredis'
const connection = new Redis({
    host : "localhost",
    port : 6379,
    maxRetriesPerRequest : null,
})
export default connection;