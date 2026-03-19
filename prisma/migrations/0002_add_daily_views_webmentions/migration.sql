-- CreateTable
CREATE TABLE "DailyViewStat" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyViewStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Webmention" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "postId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'mention',
    "authorName" TEXT,
    "authorUrl" TEXT,
    "content" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Webmention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyViewStat_date_idx" ON "DailyViewStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyViewStat_postId_date_key" ON "DailyViewStat"("postId", "date");

-- CreateIndex
CREATE INDEX "Webmention_postId_idx" ON "Webmention"("postId");

-- CreateIndex
CREATE INDEX "Webmention_target_idx" ON "Webmention"("target");

-- CreateIndex
CREATE INDEX "Webmention_createdAt_idx" ON "Webmention"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Webmention_source_target_key" ON "Webmention"("source", "target");

-- AddForeignKey
ALTER TABLE "DailyViewStat" ADD CONSTRAINT "DailyViewStat_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webmention" ADD CONSTRAINT "Webmention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
