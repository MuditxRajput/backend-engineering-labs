import express from 'express'
import { payment_create_controller } from './controller.js';
const paymentRoutes = express.Router();

paymentRoutes.post('/create-payment', payment_create_controller);
