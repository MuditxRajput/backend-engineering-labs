import { reportQueue } from "../queue/buildQueue.js"

export const add_job_service = async ({ id, type, payload }) => {
    try {
        const job =  {id,type,payload};
       const response = await reportQueue.add(job);
       if(!response) throw new Error('Error while adding the job in queue');
        console.log('it will return the job id..',response);
        return response;
    } catch (error) {
        throw error;
    }
}