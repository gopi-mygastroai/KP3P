-- Add optional unique phone for patient signup duplicate checks.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key"
  ON "User" ("phone")
  WHERE "phone" IS NOT NULL AND "phone" <> '';
