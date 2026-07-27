-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSED');

-- CreateTable
CREATE TABLE "Outbox" (
    "id" SERIAL NOT NULL,
    "notificationId" INTEGER NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Outbox_status_idx" ON "Outbox"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Outbox_notificationId_key" ON "Outbox"("notificationId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
