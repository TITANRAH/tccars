-- Split users.name into firstName/lastName with a safe backfill, and add
-- staff profile fields (active, rut, position, birthDate, startDate).

ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;

UPDATE "users"
SET
  "firstName" = split_part("name", ' ', 1),
  "lastName" = NULLIF(trim(substring("name" from position(' ' in "name") + 1)), '')
WHERE "name" IS NOT NULL;

-- Cualquier fila sin lastName (nombre de una sola palabra) queda con
-- lastName vacío en vez de nulo, para poder aplicar NOT NULL.
UPDATE "users" SET "lastName" = '' WHERE "lastName" IS NULL;
UPDATE "users" SET "firstName" = '' WHERE "firstName" IS NULL;

ALTER TABLE "users" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL;

ALTER TABLE "users" DROP COLUMN "name";

ALTER TABLE "users" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "rut" TEXT;
ALTER TABLE "users" ADD COLUMN "position" TEXT;
ALTER TABLE "users" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "startDate" TIMESTAMP(3);

CREATE UNIQUE INDEX "users_rut_key" ON "users"("rut");
