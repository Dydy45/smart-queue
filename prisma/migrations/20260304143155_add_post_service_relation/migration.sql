/*
  Warnings:

  - Added the required column `serviceId` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- Étape 1: Ajouter la colonne serviceId comme nullable temporairement
ALTER TABLE "Post" ADD COLUMN "serviceId" TEXT;

-- Étape 2: Pour chaque poste existant, assigner le premier service de son entreprise
UPDATE "Post" p
SET "serviceId" = (
  SELECT s.id 
  FROM "Service" s 
  WHERE s."companyId" = p."companyId" 
  LIMIT 1
)
WHERE "serviceId" IS NULL;

-- Étape 3: Rendre la colonne NOT NULL maintenant qu'elle a des valeurs
ALTER TABLE "Post" ALTER COLUMN "serviceId" SET NOT NULL;

-- Étape 4: Ajouter la contrainte de clé étrangère
ALTER TABLE "Post" ADD CONSTRAINT "Post_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
