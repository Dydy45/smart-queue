-- Script SQL pour supprimer l'entreprise ndjokodylan@gmail.com
-- Copie et exécute ces requêtes UNE PAR UNE dans Prisma Studio (onglet Query)

-- 1. Supprimer les tickets liés aux services de cette entreprise
DELETE FROM "Ticket" 
WHERE "serviceId" IN (
  SELECT id FROM "Service" WHERE "companyId" = (
    SELECT id FROM "Company" WHERE email = 'ndjokodylan@gmail.com'
  )
);

-- 2. Supprimer les assignations staff-poste
DELETE FROM "_PostToStaff" 
WHERE "B" IN (
  SELECT id FROM "Post" WHERE "companyId" = (
    SELECT id FROM "Company" WHERE email = 'ndjokodylan@gmail.com'
  )
);

-- 3. Supprimer les postes
DELETE FROM "Post" 
WHERE "companyId" = (
  SELECT id FROM "Company" WHERE email = 'ndjokodylan@gmail.com'
);

-- 4. Supprimer les employés (staff)
DELETE FROM "Staff" 
WHERE "companyId" = (
  SELECT id FROM "Company" WHERE email = 'ndjokodylan@gmail.com'
);

-- 5. Supprimer les services
DELETE FROM "Service" 
WHERE "companyId" = (
  SELECT id FROM "Company" WHERE email = 'ndjokodylan@gmail.com'
);

-- 6. Supprimer l'entreprise
DELETE FROM "Company" 
WHERE email = 'ndjokodylan@gmail.com';

-- 7. Vérifier que l'entreprise a bien été supprimée (doit retourner 0)
SELECT COUNT(*) as "Entreprises_restantes" FROM "Company" WHERE email = 'ndjokodylan@gmail.com';
