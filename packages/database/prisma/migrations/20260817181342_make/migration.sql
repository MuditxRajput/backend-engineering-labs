-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "dlqStatus" DROP NOT NULL,
ALTER COLUMN "dlqStatus" DROP DEFAULT;
