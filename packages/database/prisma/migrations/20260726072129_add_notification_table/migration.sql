-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ONBOARDING_WELCOME', 'FORGET_PASSWORD', 'RESET_PASSWORD', 'ORDER_INVOICE', 'ORDER_PLACED', 'ORDER_CANCELLED', 'ORDER_DELAYED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "recipient" TEXT NOT NULL,
    "event" "NotificationEvent" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" INTEGER,
    "channel" "NotificationChannel" NOT NULL,
    "payload" JSONB,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_event_orderId_channel_key" ON "Notification"("userId", "event", "orderId", "channel");
