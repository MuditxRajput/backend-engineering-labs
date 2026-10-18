import express from 'express'
import { add_job_controller } from './controller.js';
const queueRoutes = express.Router();
queueRoutes.post('/add-job', add_job_controller)
export default queueRoutes;     