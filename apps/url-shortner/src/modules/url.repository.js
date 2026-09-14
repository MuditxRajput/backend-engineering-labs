import { prisma } from "@backend/database"
export const saveShortUrlInDb=async(base62,longUrl)=>{
    try {
        // const shortUrl= `http://localhost:3000/${base62}`;
        const result = await prisma.shorturl.create({
            data:{
                shortUrl : String(base62),
                longUrl
            }
        });
        if(!result) throw new Error(`Error in saving in database`);
        return result;
    } catch (error) {
        if(error.code=="P2002")
        {
            // return the short url..
            const url = await prisma.shorturl.findUnique({
                where:{
                    longUrl,
                }
            })
            if(!url) throw new Error('Error in database')
            return url
        }
        else{
            throw error;
        }
    }
}
export const existingLongUrl = async(longUrl)=>{
    let response;
    try {
         response = await prisma.shorturl.findUnique({
            where:{
                longUrl
            }
          });
        return response;
    } catch (error) {
        throw error;
    }

}
export const checkShortUrlInDb = async(shortUrl)=>{
    try {
        const isPresent = await prisma.shorturl.findUnique({
            where : {
                shortUrl,
            }
        });
        return isPresent;
    } catch (error) {
        throw error;
    }
}
