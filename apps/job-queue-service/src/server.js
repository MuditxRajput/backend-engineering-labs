import 'dotenv/config.js'
import express from 'express'
import { app } from './app'

app.listen(process.env.PORT,()=>console.log(`Server is running..`));