import Worker from "./workerclass.js";

const worker = new Worker('report-queue');
worker.run();