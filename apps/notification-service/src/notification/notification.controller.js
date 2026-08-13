import { createNotificationService, getNotificationService } from "./notification.service.js";

export const createNotification = async (req, res) => {
    try {
        const result = await createNotificationService(req.body);
       if(!result.success){
        return res.status(500).json({msg:result.msg,success:false});
       }
       return res.status(200).json({msg:result.msg,success:true});
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};

export const getNotificationInfo=async(req,res)=>{
   try {
    const {id} = req.params;
    console.log(typeof(id));
    
    const response = await getNotificationService(Number(id));
    if(!response.success)
    {
        throw new Error(response.msg);
    }
    return res.status(200).json({msg:response.msg,info : response.info,success:true});
   } catch (error) {
    return res.status(500).json({msg:error.message,success:false});
   }
}