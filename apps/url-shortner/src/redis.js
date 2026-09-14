import connection from "../../../packages/redis/redis.connection.js"
export const setCache = async(shortcode,longUrl)=>{
    try {
        await connection.set(shortcode, longUrl, 'EX', 3600);
    } catch (error) {
        throw error;
    }
}

export const getCache = async (shortcode)=>{
     try {
        return await connection.get(shortcode);
     } catch (error) {
        throw error;
     }
}


export const analyticInc = async (shortUrl)=>{
    try {
        const analyticKey = `analytics:${shortUrl}`;
        await connection.incr(analyticKey);
    } catch (error) {
        throw error;
    }
}