import { notificationQueue } from "../queues/queue.js"

export const isQueueIsFull =async(req,res,next)=>{
  try {
    
    const getCount = await notificationQueue.getWaitingCount();
    if(getCount>2000)  return res.set("Retry-After","5").status(429).json({msg:'Queue is full , try again later',success:false});
    next();
  } catch (error) {
    return res.status(500).json({msg:error.message,success:false});
  }
}