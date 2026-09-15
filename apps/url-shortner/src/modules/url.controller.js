import { prisma } from "@backend/database";
import connection from "../../../../packages/redis/redis.connection.js";
import { analyticInc, getCache, setCache } from "../redis.js";
import { existingLongUrl } from "./url.repository.js";
import { getLongUrlService, longToShortUrlService } from "./url.service.js";

const validateUrl  = (url)=>{
    if(typeof(url)!="string") return {ok:false,msg:'long url missing'};
    const trimmed = url.trim();
    if (!trimmed) return { ok: false, msg: "Long url is missing" };
    if (trimmed.length > 2048) return { ok: false, msg: "Long url is too long" };
    let parsed;
    try {
        parsed = new URL(trimmed);
    } catch (error) {
        return { ok: false, msg: "Long url is invalid" };
    }
    if(parsed.protocol!="http:" && parsed.protocol!='https:')
    {
        return { ok: false, msg: "Only http and https urls are allowed" };
    }

    if (!parsed.hostname) {
        return { ok: false, msg: "Long url is invalid" };
      }
      return { ok: true, href: parsed.href };
}
export const createShortUrlController = async(req,res)=>{
    try {
        // in this controller we get the long url and convert into the long url...
        const {longUrl} = req.body ?? {};

        if(!longUrl) return res.status(400).json({
            msg:'Long url is missing',
            status : false
        });
        const checked =   validateUrl(longUrl);
        if (!checked.ok) {
            return res.status(400).json({ msg: checked.msg, success: false });
          }
        // existing long url ...
        const isExistingLongUrl = await existingLongUrl(longUrl);
        if(isExistingLongUrl) 
        {
            // if the cache is miss req come here we need to set the key in the cache..
           await setCache(isExistingLongUrl.shortCode,longUrl);
            return res.status(200).json({
                msg:'Already exist',
                success:true,
                url :  `http://localhost:8080/${isExistingLongUrl.shortCode}`,
            })
        }
        const shortUrl = await longToShortUrlService(longUrl);

        return res.status(200).json({
            msg:'Short url created',
            success:true,
            shorturl : `http://localhost:8080/${shortUrl.shortCode}`
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            success:false
        })
    }
}

// export const getLongUrlController = async(req,res)=>{
//   try {
//     const shortcode  = req.params.shortCode;
//     let isCacheAvailable = null;
//     try{
//             isCacheAvailable = await getCache(shortcode);
//             if(isCacheAvailable) 
//                 {
//                     try {
//                         await analyticInc(shortcode);
//                     } catch (error) {
//                         console.log('REDIS IS DOWN CACHE MISS',error.message); 
//                     }
//                     return res.redirect(302,isCacheAvailable);
//                 }
//                 else{
//                     const lock = await connection.set(
//                         `lock:${shortcode}` ,
//                         "1",
//                         "NX",
//                         "EX", 10
//                     );
//                    if(lock)
//                    {
//                     const data = await prisma.shortUrl.findUnique({
//                         where : {
//                             shortCode : shortcode
//                         }
//                     });
//                     await connection.set(`short:${shortcode}`, data.longUrl,"EX",60);
//                     await connection.del(`lock:${shortcode}`);
//                     return;
//                    }
//                    else{
//                     // waut and again check the redis...
//                     const totalWait = 10000;
//                     let wait =0;
//                     while(wait<totalWait)
//                     {
//                         await new Promise((resolve,reject)=>setTimeout(resolve,5000))
//                         const available = await getCache(shortcode);
//                         if(available) return res.redirect(302,available);
//                         wait = wait+ 5000;
//                     }
//                     // get cache...

//                    }
//                 }
//         }   
//     catch(error){
//         console.log('REDIS IS DOWN CACHE MISS',error.message);
//     }
//     const result = await getLongUrlService(shortcode);
//     if (!result.success) {
//         return res.status(404).json({ msg: result.msg, success: false });
//       }
//       return res.redirect(302, result.url);
//   } catch (error) {
//     return res.status(500).json({
//         error:error.message,
//         success:false
//     })
//   }
// }

const trackClick = async (shortcode) => {
    try {
        await analyticInc(shortcode);
    } catch (error) {
        console.log("analytics error", error.message);
    }
};

export const getLongUrlController = async(req,res)=>{
   try {
    const shortcode = req.params.shortCode;
    const lockKey = `lock:${shortcode}`;
    const missingKey = `missing:${shortcode}`;
    try {
      // first check cache..
      const cachedUrl = await getCache(shortcode);
      if(cachedUrl)
      {
        await trackClick(shortcode);
        return res.redirect(302,cachedUrl);
      }
      // cache miss... try to acquire the lock...
      const lock = await connection.set(
        lockKey,
        "1",
        "NX",
        "EX",
        20
      );
      if(lock==="OK")
      {
        try {
            const cachedAgain = await getCache(shortcode);
            if (cachedAgain) {
                await trackClick(shortcode);
                return res.redirect(302, cachedAgain);
            }

            const data = await prisma.shorturl.findUnique({
                where : {
                    shortCode : shortcode
                }
            });
            if (!data) {
                await connection.set(missingKey, "1", "EX", 30);
                return res.status(404).json({ msg: "Short URL not found", success: false });
            }
            await setCache(shortcode, data.longUrl);
            await trackClick(shortcode);
            return res.redirect(302,data.longUrl);
        } catch (error) {
            console.log(error.message);
        }
        finally{
            await connection.del(lockKey);
        }
      }
      else{
        //someone else has the lock...
        // wait and keep checking redis
        const totalWait = 8000;
        const retryInterval = 100;
        let waited = 0;
        while(waited<totalWait)
        {
            await new Promise(resolve=>setTimeout(resolve, retryInterval))
            waited+=retryInterval;
            const available = await getCache(shortcode);
            if (available) {
                await trackClick(shortcode);
                return res.redirect(302, available);
            }
            const missing = await connection.get(missingKey);
            if (missing) {
                return res.status(404).json({ msg: "Short URL not found", success: false });
            }
        }
      }
    } catch (error) {
        console.log('Redis down',error.message);
    }

    // cache still unavailable after waiting
    // fall back to normal db/service logic..

    const result = await getLongUrlService(shortcode);
    if (!result.success) { return res.status(404).json({ msg: result.msg, success: false }); }
    return res.redirect(302,result.url)
   } catch (error) {
     console.log('something went wrong');
     return res.status(500).json({
        error:error.message,
        success:false
     })
     
   }
}