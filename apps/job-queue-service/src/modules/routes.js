import express from 'express'
import { add_job_controller } from './controller';
const queueRoutes = express.Router();


queueRoutes.post('/add-job', add_job_controller)