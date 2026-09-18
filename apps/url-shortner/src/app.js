import express from 'express'
import urlRoutes from './modules/url.routes.js';
import { getLongUrlController } from './modules/url.controller.js';
import { rateLimit } from './middleware/rateLimit.js';
const app = express();
app.use(express.json());
app.use('/health-check-url-shortner',(req,res)=>res.send('RUNNIG'));
app.use('/api/v1/',urlRoutes);
app.get('/:shortCode',rateLimit,getLongUrlController)
export default app;