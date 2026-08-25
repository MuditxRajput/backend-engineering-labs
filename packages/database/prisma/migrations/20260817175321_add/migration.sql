-- CreateEnum
CREATE TYPE "DLQStatus" AS ENUM ('PENDING', 'COMPLETE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dlqStatus" "DLQStatus" NOT NULL DEFAULT 'PENDING';
