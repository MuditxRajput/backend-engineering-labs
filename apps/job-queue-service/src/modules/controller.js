import { add_job_service } from "./service";

export const add_job_controller = async (req, res) => {
    try {
        const { id, type, payload } = req.body;
        // validate this data before using it ...
        const result = await add_job_service({ id, type, payload });

    } catch (error) {

    }
}