-- Add Laboratory & Investigations fields back for admin assessment Step 5
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "recentLabValues" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "dateMostRecentColonoscopy" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "colonoscopyFindings" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "recentImaging" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "mostRecentDexaScan" TEXT NOT NULL DEFAULT '';
