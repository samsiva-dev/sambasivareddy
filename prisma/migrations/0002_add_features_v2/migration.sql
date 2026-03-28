-- AlterTable: Post - add soft delete, canonical URL, series support
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "seriesOrder" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Post_deletedAt_idx" ON "Post"("deletedAt");
CREATE INDEX IF NOT EXISTS "Post_seriesId_idx" ON "Post"("seriesId");

-- CreateTable: Series
CREATE TABLE IF NOT EXISTS "Series" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Series_slug_key" ON "Series"("slug");
CREATE INDEX IF NOT EXISTS "Series_slug_idx" ON "Series"("slug");

-- AddForeignKey: Post -> Series
ALTER TABLE "Post" ADD CONSTRAINT "Post_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Comment - add threading and soft delete
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId");

-- AddForeignKey: Comment self-relation for threading
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Subscriber - add interests
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "interests" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: ReadingStat
CREATE TABLE IF NOT EXISTS "ReadingStat" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "avgScrollDepth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTimeOnPage" INTEGER NOT NULL DEFAULT 0,
    "bounces" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "totalReads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ReadingStat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReadingStat_postId_date_key" ON "ReadingStat"("postId", "date");
CREATE INDEX IF NOT EXISTS "ReadingStat_date_idx" ON "ReadingStat"("date");
CREATE INDEX IF NOT EXISTS "ReadingStat_postId_idx" ON "ReadingStat"("postId");

-- AddForeignKey: ReadingStat -> Post
ALTER TABLE "ReadingStat" ADD CONSTRAINT "ReadingStat_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CsrfToken
CREATE TABLE IF NOT EXISTS "CsrfToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsrfToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CsrfToken_token_key" ON "CsrfToken"("token");
CREATE INDEX IF NOT EXISTS "CsrfToken_token_idx" ON "CsrfToken"("token");
CREATE INDEX IF NOT EXISTS "CsrfToken_expiresAt_idx" ON "CsrfToken"("expiresAt");
