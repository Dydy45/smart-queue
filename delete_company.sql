-- Script pour supprimer une entreprise et toutes ses dépendances
-- Remplace 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER' par l'email de l'entreprise créée par erreur

-- 1. Trouver l'ID de l'entreprise
-- SELECT id, email, name FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER';

-- 2. Supprimer dans l'ordre (du plus dépendant au moins dépendant)

-- Supprimer les tickets liés aux services de cette entreprise
DELETE FROM "Ticket" 
WHERE "serviceId" IN (
  SELECT id FROM "Service" WHERE "companyId" = (
    SELECT id FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER'
  )
);

-- Supprimer la table de liaison Staff <-> Post
DELETE FROM "_PostToStaff" 
WHERE "B" IN (
  SELECT id FROM "Post" WHERE "companyId" = (
    SELECT id FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER'
  )
);

-- Supprimer les postes
DELETE FROM "Post" 
WHERE "companyId" = (
  SELECT id FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER'
);

-- Supprimer les employés (staff)
DELETE FROM "Staff" 
WHERE "companyId" = (
  SELECT id FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER'
);

-- Supprimer les services
DELETE FROM "Service" 
WHERE "companyId" = (
  SELECT id FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER'
);

-- Supprimer l'entreprise
DELETE FROM "Company" 
WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER';

-- Vérifier que l'entreprise a bien été supprimée
SELECT COUNT(*) as "Entreprises restantes" FROM "Company" WHERE email = 'EMAIL_DE_LENTREPRISE_A_SUPPRIMER';
