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
           await setCache(isExistingLongUrl.shortUrl,longUrl);
            return res.status(200).json({
                msg:'Already exist',
                success:true,
                url :  `http://localhost:8080/${isExistingLongUrl.shortUrl}`,
            })
        }
        const shortUrl = await longToShortUrlService(longUrl);

        return res.status(200).json({
            msg:'Short url created',
            success:true,
            shorturl : `http://localhost:8080/${shortUrl.shortUrl}`
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            success:false
        })
    }
}

export const getLongUrlController = async(req,res)=>{
  try {
    const shortcode  = req.params.shortCode;
    let isCacheAvailable = null;
    try{
            isCacheAvailable = await getCache(shortcode);
            if(isCacheAvailable) 
                {
                    try {
                        await analyticInc(shortcode);
                    } catch (error) {
                        console.log('REDIS IS DOWN CACHE MISS',error.message); 
                    }
                    return res.redirect(302,isCacheAvailable);
                }
        }   
    catch(error){
        console.log('REDIS IS DOWN CACHE MISS',error.message);
    }
    const result = await getLongUrlService(shortcode);
    if (!result.success) {
        return res.status(404).json({ msg: result.msg, success: false });
      }
      return res.redirect(302, result.url);
  } catch (error) {
    return res.status(500).json({
        error:error.message,
        success:false
    })
  }
}