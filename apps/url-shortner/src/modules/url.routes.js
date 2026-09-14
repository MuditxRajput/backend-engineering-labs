import express from 'express';
import { createShortUrlController, getLongUrlController } from './url.controller.js';
const urlRoutes = express.Router();

urlRoutes.post('/create-short-url',createShortUrlController);
// urlRoutes.get('/get-long-url',getLongUrlController)
export default urlRoutes;