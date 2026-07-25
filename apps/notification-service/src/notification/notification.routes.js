import express from 'express';
import { createNotification } from './notification.controller.js';
// import { acceptNotification, checkNotification } from './notification.controller.js';

const notificationRoutes = express.Router();

notificationRoutes.post('/',createNotification)



export default notificationRoutes;