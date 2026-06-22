-- Consolidate infection screening into JSON sets; migrate legacy flat columns.
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "infectionScreening" TEXT NOT NULL DEFAULT '{"sets":[]}';

UPDATE "Patient"
SET "infectionScreening" = json_build_object(
  'sets',
  json_build_array(
    json_build_object(
      'screeningDate', COALESCE("infectionScreeningDate", ''),
      'tbQuantiFERONGold', COALESCE("tbQuantiFERONGold", ''),
      'tbChestXRay', COALESCE("tbChestXRay", ''),
      'tbCtChest', COALESCE("tbCtChest", ''),
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
    COALESCE("infectionScreeningDate", '') <> ''
    OR COALESCE("tbQuantiFERONGold", '') <> ''
    OR COALESCE("tbChestXRay", '') <> ''
    OR COALESCE("tbCtChest", '') <> ''
    OR COALESCE("hepBSurfaceAg", '') <> ''
    OR COALESCE("hepBSurfaceAb", '') <> ''
    OR COALESCE("hepBCoreAb", '') <> ''
    OR COALESCE("antiHcv", '') <> ''
    OR COALESCE("antiHiv", '') <> ''
  );

ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbQuantiFERONGold";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbChestXRay";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tbCtChest";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "infectionScreeningDate";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "hepBSurfaceAg";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "hepBSurfaceAb";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "hepBCoreAb";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "antiHcv";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "antiHiv";
