-- CreateIndex
CREATE INDEX "Outbox_status_updatedAt_idx" ON "Outbox"("status", "updatedAt");
