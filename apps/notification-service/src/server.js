import 'dotenv/config';
import app from './app.js';
import { outboxWorker } from './worker/outbox.relay.js';
import { notificationWorker } from './worker/notification.worker.js';
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
let running = false;
setInterval(() => {
    if(running) return;
    running = true;
    outboxWorker().catch((err)=>console.error('Outbox error',err)
    ).finally(()=>{
        running = false;
    });
}, 3000);