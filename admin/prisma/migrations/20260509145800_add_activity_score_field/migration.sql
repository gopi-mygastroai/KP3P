-- Add optional activity score field for Symptoms step
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "activityScore" TEXT NOT NULL DEFAULT '';
