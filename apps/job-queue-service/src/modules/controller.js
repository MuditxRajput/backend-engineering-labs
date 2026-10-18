import { add_job_service } from "./service.js";

export const add_job_controller = async (req, res) => {
    try {
        const { id, type, payload } = req.body;
        // validate this data before using it ...
        const result = await add_job_service({ id, type, payload });
        return res.status(200).json({msg:result});
    } catch (error) {
      return res.status(500).json({error:error.message})
    }
}