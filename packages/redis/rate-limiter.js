// for rate limiter i use the sliding window algo...
import connection from "./redis.connection.js";
import crypto from 'crypto'
const KEY="resend:sliding";
const WINDOW = 60*1000;
const LIMIT = 100;
export const allowedResend = async()=>{
    try {
       const now = Date.now();
       await connection.zremrangebyscore(KEY,0,now-WINDOW);

       const count = await connection.zcard(KEY);
       if(count>=LIMIT)
       {
        return false;
       }
       await connection.zadd(KEY,
        now,
         crypto.randomUUID()
       );
       return true;
    } catch (error) {
        console.log("Rate limited error:",error);
        return false;
    }
}