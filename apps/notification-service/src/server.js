import 'dotenv/config';
import app from './app.js';
import { outboxWorker } from './worker/outbox.relay.js';
import { notificationWorker } from './worker/notification.worker.js';
import { recoveryOutboxWorker } from './worker/recovery.outbox.js';
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
let running1 = false;
let running2 = false;
const outboxWorkerfn1 = () => {
    setInterval(() => {
        if (running1) return;
        running1 = true;
        outboxWorker().catch((err) => console.error('Outbox error', err)
        ).finally(() => {
            running1 = false;
        });
    }, 3000);
}
const outboxWorkerfn2 = () => {
    setInterval(() => {
        if (running2) return;
        running2 = true;
        outboxWorker().catch((err) => console.error('Outbox error', err)
        ).finally(() => {
            running2 = false;
        });
    }, 3000);
}
let isrecoveryRunning = false;
const recoveryOutboxWorkerfn = () => {
        setInterval(() => {
            if(!isrecoveryRunning)
            {
                isrecoveryRunning = true;
                recoveryOutboxWorker().catch((err) => console.error('Recovery outbox error', err)).finally(() => isrecoveryRunning = false);
            }
        }, 3000)
}
outboxWorkerfn1();
outboxWorkerfn2();
recoveryOutboxWorkerfn();
