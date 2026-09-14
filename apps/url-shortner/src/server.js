import 'dotenv/config';
import express from 'express';
import app from './app.js';

app.listen(process.env.PORT,()=>console.log(`Server is running..`)); 