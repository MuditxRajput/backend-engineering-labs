import { prisma } from "@backend/database";
import connection from "../../../../packages/redis/redis.connection.js"
import { convertToBase62 } from "../../base62.js";
import { analyticInc, setCache } from "../redis.js";
import { checkShortUrlInDb, saveShortUrlInDb } from "./url.repository.js";

export const longToShortUrlService = async(longUrl)=>{
    try {
        //here we use the longurl to convert into short..
        // 1 increase the counter in the redis ...
        const counter = await connection.incr("url:counter");
        // we get the counter,not convert the counter into base62.. 
        const base62 = convertToBase62(counter);
        const result= await saveShortUrlInDb(base62,longUrl);

        await setCache(base62,longUrl);

        return result;
    } catch (error) {
        throw error;
    }
}
export const getLongUrlService =async (shortcode)=>{
  try {
    // cache is missed we need to hit the database but before it we need to check that is this shorturl is pesent in the database or not ..
    const existingShortUrl = await checkShortUrlInDb(shortcode);

    if(!existingShortUrl)
    {
        // shortUrl is not present in the database...
        return {msg:'ShortUrl is not present',success:false}
    }
    // if it is present then we have to set in the redis...
    try {
      await setCache(shortcode,existingShortUrl.longUrl);
    } catch (error) {
        // redis is down ..
        console.log("Redis cache set failed:", error.message);
    }
    try{
     await analyticInc(shortcode);
    }
    catch(error){
      console.log("Redis cache set failed:", error.message);
    }

    return {url : existingShortUrl?.longUrl,success:true};
  } catch (error) {
    throw error;
  }
}