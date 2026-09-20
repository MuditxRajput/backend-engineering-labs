import express from 'express'
import { rateLimit } from '../middleware/rate-limiter';
const app = express();
app.use(express.json());
app.use('/health',(req,res)=>res.send('RUNNIG'));
app.use('/v1/check',rateLimit,(req,res)=>res.send('hello'))
export default app;