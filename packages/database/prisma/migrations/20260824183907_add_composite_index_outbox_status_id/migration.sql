-- DropIndex
DROP INDEX "Outbox_status_idx";

-- CreateIndex
CREATE INDEX "Outbox_status_id_idx" ON "Outbox"("status", "id");
