import express from 'express'
import queueRoutes from './modules/routes.js';
export const app = express();
app.use(express.json());
app.use('/api/v1', queueRoutes);
