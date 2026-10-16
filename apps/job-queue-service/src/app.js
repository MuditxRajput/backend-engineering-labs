import express from 'express'
export const app = express();
app.use(express.json());
app.post('api/v1/', job_queue);