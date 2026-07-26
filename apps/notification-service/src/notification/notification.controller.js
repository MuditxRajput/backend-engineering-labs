import { createNotificationService } from "./notification.service.js";

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