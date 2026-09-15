/*
  Warnings:

  - A unique constraint covering the columns `[shortUrl]` on the table `shorturl` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[longUrl]` on the table `shorturl` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "shorturl_shortUrl_longUrl_key";

-- CreateIndex
CREATE UNIQUE INDEX "shorturl_shortUrl_key" ON "shorturl"("shortUrl");

-- CreateIndex
CREATE UNIQUE INDEX "shorturl_longUrl_key" ON "shorturl"("longUrl");
