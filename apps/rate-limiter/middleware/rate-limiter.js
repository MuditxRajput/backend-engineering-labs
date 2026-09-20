import connection from "../../../packages/redis/redis.connection";

export const rateLimit = async(req,res,next)=>{
  try {
    const ip = req.ip;
    const key = `User:${ip}:new`;
     await connection.zremrangebyscore(key,-Infinity,Date.now()-60*1000);
     const total = await connection.zcard(key);
     if(total>=60) {
        return res.status(429).json({
            msg:'Too many request',
            success : false,
        });
     }
     await connection.zadd(key,Date.now(),`req-${Math.random()}`);

     next();

  } catch (error) {
    return res.status(500).json({
        error:error.message,
        success:false,
    })
  }
}