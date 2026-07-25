-- Bridge columns to map Supabase auth.users -> app rows.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authUserId" UUID;
ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "authUserId" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "User_authUserId_key"
  ON "User" ("authUserId")
  WHERE "authUserId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Patient_authUserId_idx"
  ON "Patient" ("authUserId");
