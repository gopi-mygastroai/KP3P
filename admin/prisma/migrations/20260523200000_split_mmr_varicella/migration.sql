ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "mmr" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "varicella" TEXT NOT NULL DEFAULT '{}';

UPDATE "Patient"
SET "mmr" = "mmrVaricella"
WHERE ("mmr" = '{}' OR "mmr" = '')
  AND "mmrVaricella" IS NOT NULL
  AND "mmrVaricella" <> ''
  AND "mmrVaricella" <> '{}';
