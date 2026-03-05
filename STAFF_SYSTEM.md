# Système de Gestion des Employés - Documentation

## Vue d'ensemble

Le système permet au propriétaire d'une entreprise d'ajouter des employés qui peuvent se connecter avec leur propre compte Clerk et accéder à certaines fonctionnalités de l'application selon leur rôle.

## Rôles

### 1. OWNER (Propriétaire)
- **Qui** : La personne qui a créé l'entreprise (email dans la table `Company`)
- **Accès** : Toutes les fonctionnalités
- **Permissions** :
  - Gérer les services (créer, modifier, supprimer)
  - Gérer les postes (créer, modifier, supprimer)
  - Gérer les employés (ajouter, modifier rôle, supprimer)
  - Assigner des postes aux employés
  - Voir tous les tickets
  - Traiter les tickets
  - Voir les statistiques

### 2. ADMIN (Administrateur)
- **Qui** : Employé ajouté par le propriétaire avec le rôle ADMIN
- **Accès** : Presque toutes les fonctionnalités sauf la gestion des employés
- **Permissions** :
  - Voir tous les tickets de l'entreprise
  - Traiter les tickets de tous les postes
  - Voir les statistiques
  - **Ne peut PAS** : gérer les services, postes ou employés

### 3. STAFF (Employé)
- **Qui** : Employé ajouté par le propriétaire avec le rôle STAFF
- **Accès** : Fonctionnalités limitées
- **Permissions** :
  - Voir uniquement les tickets des postes qui lui sont assignés
  - Traiter les tickets de ses postes assignés
  - **Ne peut PAS** : voir les autres tickets, gérer services/postes/employés

## Architecture Technique

### Base de données (Prisma)

```prisma
enum Role {
  ADMIN
  STAFF
}

model Staff {
  id            String   @id @default(uuid())
  email         String
  name          String
  role          Role     @default(STAFF)
  companyId     String
  createdAt     DateTime @default(now())
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  assignedPosts Post[]   // Relation many-to-many

  @@unique([email, companyId])
}

model Post {
  // ... autres champs
  assignedStaff Staff[]  // Relation inverse
}
```

### Authentification (`lib/auth.ts`)

**Fonction principale : `verifyStaffAccess(email)`**

```typescript
// Retourne { role: 'OWNER' | 'ADMIN' | 'STAFF', companyId: string, staffId?: string }

// 1. Vérifie si l'email correspond au propriétaire (table Company)
//    → Retourne { role: 'OWNER', companyId }

// 2. Sinon, vérifie si l'email est dans la table Staff
//    → Retourne { role: staff.role, companyId, staffId }

// 3. Sinon, throw Error('Vous n\'avez pas accès à cette entreprise')
```

### Server Actions modifiées

Les actions suivantes utilisent maintenant `verifyStaffAccess` au lieu de `verifyCompanyOwnership` :

- `getPendingTicketsByEmail()` - Voir les tickets
- `getLastTicketByEmail()` - Appeler le prochain ticket
- `updateTicketStatus()` - Changer le statut d'un ticket

Les actions suivantes gardent `verifyCompanyOwnership` (réservées au propriétaire) :

- `createService()`, `deleteServiceById()`, `getServiceByEmail()`
- `createPost()`, `deletePost()`, `getPostsByCompanyEmail()`
- `addStaff()`, `updateStaffRole()`, `removeStaff()`
- `assignPostToStaff()`, `unassignPostFromStaff()`

## Workflow d'utilisation

### 1. Le propriétaire ajoute un employé

1. Va sur `/staff`
2. Remplit le formulaire :
   - Email de l'employé (doit correspondre à son compte Clerk)
   - Nom complet
   - Rôle (ADMIN ou STAFF)
3. Clique sur "Ajouter l'employé"

### 2. L'employé se connecte

1. L'employé va sur l'application
2. Se connecte avec Clerk en utilisant l'email qui a été ajouté
3. **Important** : L'email Clerk DOIT correspondre exactement à l'email ajouté dans la table Staff

### 3. L'employé accède aux fonctionnalités

**Pour un ADMIN :**
- Voit tous les tickets sur `/` (dashboard)
- Peut accéder à `/call/[idPoste]` pour n'importe quel poste
- Peut traiter les tickets

**Pour un STAFF :**
- Voit tous les tickets sur `/` (dashboard) - **À AMÉLIORER** : devrait voir uniquement ses postes
- Peut accéder à `/call/[idPoste]` pour n'importe quel poste - **À AMÉLIORER** : devrait être limité à ses postes assignés
- Peut traiter les tickets

## Limitations actuelles et améliorations futures

### ⚠️ Limitations

1. **Pas de filtrage par poste assigné** : Un STAFF voit tous les tickets, pas uniquement ceux de ses postes assignés
2. **Pas d'UI pour assigner des postes** : Les fonctions existent (`assignPostToStaff`, `unassignPostFromStaff`) mais pas d'interface utilisateur
3. **Navbar identique pour tous** : Tous les rôles voient les mêmes liens (Services, Postes, Staff)

### 🎯 Améliorations recommandées

1. **Filtrer les tickets par poste assigné pour les STAFF**
   ```typescript
   // Dans getPendingTicketsByEmail, si role === 'STAFF'
   const assignedPosts = await prisma.staff.findUnique({
     where: { id: staffId },
     include: { assignedPosts: true }
   })
   // Filtrer les tickets uniquement pour ces postes
   ```

2. **Ajouter l'UI d'assignation de postes dans `/staff`**
   - Afficher les postes assignés pour chaque employé
   - Boutons pour assigner/retirer des postes

3. **Adapter la Navbar selon le rôle**
   ```typescript
   // Récupérer le rôle de l'utilisateur
   const { role } = await verifyStaffAccess(email)
   
   // Afficher conditionnellement les liens
   {role === 'OWNER' && <Link href="/staff">Gestion Staff</Link>}
   {role !== 'STAFF' && <Link href="/services">Services</Link>}
   ```

4. **Page d'accueil différente selon le rôle**
   - OWNER/ADMIN → Dashboard complet
   - STAFF → Liste de ses postes assignés uniquement

## Tests

### Test manuel

1. **Créer un compte propriétaire**
   - Se connecter avec Clerk
   - Créer des services et postes

2. **Ajouter un employé STAFF**
   - Aller sur `/staff`
   - Ajouter un email (ex: `staff@test.com`)
   - Rôle: STAFF

3. **Se connecter en tant qu'employé**
   - Se déconnecter
   - Créer un nouveau compte Clerk avec `staff@test.com`
   - Se connecter
   - Vérifier l'accès aux pages `/` et `/call/[idPoste]`

4. **Vérifier les permissions**
   - L'employé STAFF ne devrait PAS pouvoir accéder à `/staff`, `/services`, `/poste_list`
   - L'employé STAFF devrait pouvoir traiter des tickets

## Sécurité

- ✅ Validation Zod sur tous les inputs
- ✅ Rate limiting sur toutes les actions staff
- ✅ Vérification d'appartenance à l'entreprise (via `verifyStaffAccess`)
- ✅ Contrainte unique `@@unique([email, companyId])` empêche les doublons
- ✅ Cascade delete : si l'entreprise est supprimée, tous les staff sont supprimés

## Dépannage

### "Vous n'avez pas accès à cette entreprise"

**Cause** : L'email Clerk ne correspond pas à un email dans la table Staff

**Solution** :
1. Vérifier que l'email a bien été ajouté dans `/staff`
2. Vérifier que l'email Clerk correspond exactement (casse comprise)
3. Vérifier dans la base de données PostgreSQL :
   ```sql
   SELECT * FROM "Staff" WHERE email = 'email@test.com';
   ```

### L'employé voit une page blanche

**Cause** : Erreur d'authentification non gérée

**Solution** :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs
3. Vérifier les logs du serveur Next.js

### L'employé ne peut pas traiter de tickets

**Cause** : `verifyStaffAccess` échoue

**Solution** :
1. Vérifier que l'action utilise bien `verifyStaffAccess` et non `verifyCompanyOwnership`
2. Vérifier les logs serveur pour voir l'erreur exacte
