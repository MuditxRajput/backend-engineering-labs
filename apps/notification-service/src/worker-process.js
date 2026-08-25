import 'dotenv/config';
import { outboxWorker } from './worker/outbox.relay.js';
import './worker/notification.worker.js';
import { recoveryOutboxWorker } from './worker/recovery.outbox.js';
import { dlqRecovery } from './worker/dlq.recovery.js';

let running1 = false;
let running2 = false;
let isRecoveryRunning = false;
let isDlqRunning = false;

setInterval(async () => {
    if (running1) return;
    running1 = true;
    await outboxWorker('OUTBOX-WORKER-1')
        .catch((error) => console.error('Outbox error', error))
        .finally(() => {
            running1 = false;
        });
}, 10000);

setInterval(async () => {
    if (running2) return;
    running2 = true;
    await outboxWorker('OUTBOX-WORKER-2')
        .catch((error) => console.error('Outbox error', error))
        .finally(() => {
            running2 = false;
        });
}, 15000);

setInterval(async () => {
    if (isRecoveryRunning) return;
    isRecoveryRunning = true;
    await recoveryOutboxWorker()
        .catch((error) => console.error('Recovery outbox error', error))
        .finally(() => {
            isRecoveryRunning = false;
        });
}, 20000);

setInterval(async () => {
    if (isDlqRunning) return;
    isDlqRunning = true;
    await dlqRecovery()
        .catch((error) => console.error('DLQ recovery error', error))
        .finally(() => {
            isDlqRunning = false;
        });
}, 30000);

console.log('Worker process started');
