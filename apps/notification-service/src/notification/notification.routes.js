import express from 'express';
import { createNotification, getNotificationInfo } from './notification.controller.js';
import { payloadValidation } from '../middleware/validation.middleware.js';
import { isQueueIsFull } from '../middleware/isQueueIsFull.middleware.js';
// import { acceptNotification, checkNotification } from './notification.controller.js';

const notificationRoutes = express.Router();

notificationRoutes.post('/',payloadValidation,isQueueIsFull,createNotification);
notificationRoutes.get('/:id',getNotificationInfo);
export default notificationRoutes;