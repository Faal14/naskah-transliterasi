-- CreateTable
CREATE TABLE "PlatformRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "displayName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformRating_guestId_idx" ON "PlatformRating"("guestId");

-- CreateIndex
CREATE INDEX "PlatformRating_userId_idx" ON "PlatformRating"("userId");

-- CreateIndex
CREATE INDEX "PlatformReview_createdAt_idx" ON "PlatformReview"("createdAt");
