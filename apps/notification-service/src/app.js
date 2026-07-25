
import express from 'express';
import notificationRoutes from './notification/notification.routes.js';

const app = express();
app.use(express.json());
app.use('/notifications', notificationRoutes);

export default app;