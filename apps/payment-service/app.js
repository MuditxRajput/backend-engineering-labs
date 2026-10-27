import express from 'express'
export const app = express();

app.use('/api/v1', paymentRoutes);