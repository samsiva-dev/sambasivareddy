-- CreateTable
CREATE TABLE "DraftShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "DraftShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DraftShare_token_key" ON "DraftShare"("token");

-- CreateIndex
CREATE INDEX "DraftShare_token_idx" ON "DraftShare"("token");

-- CreateIndex
CREATE INDEX "DraftShare_postId_idx" ON "DraftShare"("postId");

-- CreateIndex
CREATE INDEX "DraftShare_email_idx" ON "DraftShare"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DraftShare_postId_email_key" ON "DraftShare"("postId", "email");

-- AddForeignKey
ALTER TABLE "DraftShare" ADD CONSTRAINT "DraftShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
