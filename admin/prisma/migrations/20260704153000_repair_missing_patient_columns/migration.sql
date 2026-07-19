-- Repair: prior migrations were recorded as applied but these columns were never created
-- (likely after a DB restore). Idempotent so safe to re-run.

ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "hbiScoring" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "partialMayoScoring" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "radiologyInvestigations" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "infectionScreening" TEXT NOT NULL DEFAULT '{"sets":[]}';

-- Migrate legacy flat infection-screening columns into JSON sets when still empty.
UPDATE "Patient"
SET "infectionScreening" = json_build_object(
  'sets',
  json_build_array(
    json_build_object(
      'screeningDate', '',
      'tbQuantiFERONGold', CASE
        WHEN COALESCE("tbScreening", '') = '' THEN ''
        WHEN "tbScreening" = 'Not done' THEN 'Not done'
        WHEN "tbScreening" = 'Done - Negative (IGRA or TST)' THEN 'Done - Negative'
        WHEN "tbScreening" = 'Done - Positive, treated' THEN 'Done - Positive, treated'
        WHEN "tbScreening" = 'Done - Positive, not treated' THEN 'Done - Positive, not treated'
        WHEN "tbScreening" = 'Unknown' THEN 'Unknown'
        WHEN "tbScreening" = 'Negative' THEN 'Done - Negative'
        WHEN "tbScreening" = 'Positive' THEN 'Done - Positive, not treated'
        ELSE "tbScreening"
      END,
      'tbChestXRay', '',
      'tbCtChest', '',
      'hepBSurfaceAg', COALESCE("hepBSurfaceAg", ''),
      'hepBSurfaceAb', COALESCE("hepBSurfaceAb", ''),
      'hepBCoreAb', COALESCE("hepBCoreAb", ''),
      'antiHcv', COALESCE("antiHcv", ''),
      'antiHiv', COALESCE("antiHiv", '')
    )
  )
)::text
WHERE COALESCE("infectionScreening", '{"sets":[]}') IN ('', '{"sets":[]}')
  AND (
    COALESCE("tbScreening", '') <> ''
    OR COALESCE("hepBSurfaceAg", '') <> ''
    OR COALESCE("hepBSurfaceAb", '') <> ''
    OR COALESCE("hepBCoreAb", '') <> ''
    OR COALESCE("antiHcv", '') <> ''
    OR COALESCE("antiHiv", '') <> ''
  );

ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbScreening";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbQuantiFERONGold";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbChestXRay";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbCtChest";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "infectionScreeningDate";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "hepBSurfaceAg";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "hepBSurfaceAb";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "hepBCoreAb";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "antiHcv";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "antiHiv";
