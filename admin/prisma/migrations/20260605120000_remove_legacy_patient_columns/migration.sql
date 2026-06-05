-- Drop legacy Patient columns with no assessment / edit UI
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "recentLabValues";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "dateMostRecentColonoscopy";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "colonoscopyFindings";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "recentImaging";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "mostRecentDexaScan";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "documents";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "currentIbdMedications";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "steroidUse";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "tdmResults";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "currentSupplements";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "previousTreatmentsTried";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "mmrVaricella";
