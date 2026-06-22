-- Replace legacy tbScreening with TB sub-fields; hep/HIV fields keep same columns with new picklist values.
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "tbQuantiFERONGold" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "tbChestXRay" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "tbCtChest" TEXT NOT NULL DEFAULT '';

UPDATE "Patient"
SET "tbQuantiFERONGold" = CASE
  WHEN COALESCE("tbScreening", '') = '' THEN ''
  WHEN "tbScreening" = 'Not done' THEN 'Not done'
  WHEN "tbScreening" = 'Done - Negative (IGRA or TST)' THEN 'Done - Negative'
  WHEN "tbScreening" = 'Done - Positive, treated' THEN 'Done - Positive, treated'
  WHEN "tbScreening" = 'Done - Positive, not treated' THEN 'Done - Positive, not treated'
  WHEN "tbScreening" = 'Unknown' THEN 'Unknown'
  WHEN "tbScreening" = 'Negative' THEN 'Done - Negative'
  WHEN "tbScreening" = 'Positive' THEN 'Done - Positive, not treated'
  ELSE "tbScreening"
END
WHERE COALESCE("tbScreening", '') <> '';

ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbScreening";
