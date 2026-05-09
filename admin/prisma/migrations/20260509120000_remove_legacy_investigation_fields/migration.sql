-- Remove fields superseded by document uploads / streamlined Health Records tab
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "dateMostRecentColono";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "recentLabValues";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "colonoscopyFindings";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "recentImaging";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "mostRecentDexa";
