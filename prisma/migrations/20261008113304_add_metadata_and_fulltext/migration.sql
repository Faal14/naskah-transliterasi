-- AlterTable
ALTER TABLE "Manuscript" ADD COLUMN     "author" TEXT,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "mediaType" TEXT,
ADD COLUMN     "period" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "fullTranslation" TEXT,
ADD COLUMN     "fullTransliteration" TEXT;
