-- AlterTable
ALTER TABLE "Patient" ALTER COLUMN "smokingDetails" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updatedAt" DROP DEFAULT;
