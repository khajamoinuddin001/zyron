-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "theme" TEXT;

-- AlterTable
ALTER TABLE "OrganizationRole" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
