import connection from "../../../../packages/redis/redis.connection.js";

// const maxReq = 60; 
export const rateLimit =async(req,res,next)=>{

  try {
    // check is user is present already ...
    const ip = req.ip;
    const existingUser = await connection.exists(`User:${ip}`);
    let user;
    if(existingUser==0)
    {
        // user is not existed , we need to create the key and add the timestamp..
        user =  await connection.rpush(`User:${ip}`,Date.now());
        next();
    }
    else{
        // we need to check is it is too many request
        // const rnTime = Date.now();
        const timestamp = await connection.lrange(
            `User:${ip}`,
            0,
            -1,
          );
        const filteredTime = timestamp.filter((val)=>Date.now()-Number(val)<60*1000);
        if(filteredTime.length>=60)
        {
            // throw new Error('Too many request')
            return res.status(429).json({
                msg:'Too many req',
            })
        }
        else{
            filteredTime.push(Date.now());
            await connection.del(`User:${ip}`);
            await connection.rpush(`User:${ip}`,...filteredTime);
        }
         
      next();
    }
    // const user = await connection.zadd(`User:${ip}`,Date.now(),`${ip}-req-${Math.random()}`);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
        error:error.message,
        success:false
    })
    
    
  }
}