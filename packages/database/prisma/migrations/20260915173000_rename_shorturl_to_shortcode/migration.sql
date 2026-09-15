-- Rename column shortUrl -> shortCode (keep existing data)
ALTER TABLE "shorturl" RENAME COLUMN "shortUrl" TO "shortCode";

-- Rename unique index to match Prisma naming
ALTER INDEX "shorturl_shortUrl_key" RENAME TO "shorturl_shortCode_key";
