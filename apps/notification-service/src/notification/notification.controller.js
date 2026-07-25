import { createNotificationService } from "./notification.service.js";

export const createNotification = async (req, res) => {
    try {
        const result = await createNotificationService(req.body);
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
};