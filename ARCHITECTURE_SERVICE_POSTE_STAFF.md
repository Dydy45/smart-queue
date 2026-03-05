# Architecture Service → Poste → Staff

## 🎯 Vision et Workflow

Cette architecture implémente une hiérarchie claire et logique pour la gestion des tickets :

```
Entreprise
  └─ Service (ex: "Consultation médicale")
      └─ Poste 1 (ex: "Cabinet A")
          └─ Staff 1, Staff 2
      └─ Poste 2 (ex: "Cabinet B")
          └─ Staff 3
```

## 📋 Workflow complet

### 1. Configuration par le propriétaire

**Étape 1 : Créer des services**
- Va sur `/services`
- Crée des services (ex: "Consultation", "Radiologie", "Analyses")
- Chaque service a un temps moyen de traitement

**Étape 2 : Créer des postes pour chaque service**
- Va sur `/poste_list`
- **Sélectionne un service** dans le dropdown
- Entre le nom du poste (ex: "Cabinet 1", "Salle A")
- Le poste est automatiquement lié au service choisi

**Étape 3 : Ajouter des employés et les assigner aux postes**
- Va sur `/staff`
- Ajoute un employé (email, nom, rôle)
- Assigne l'employé à un ou plusieurs postes
- L'employé hérite automatiquement des services de ses postes

### 2. Client crée un ticket

**Sur `/page/[pageName]` :**
1. Le client choisit un **service** (ex: "Consultation")
2. Entre son nom
3. Reçoit un numéro de ticket (ex: T123ABC)
4. Le ticket est créé avec :
   - `serviceId` = ID du service choisi
   - `status` = "PENDING"
   - `postId` = null (pas encore assigné à un poste)

### 3. Staff traite les tickets

**Dashboard `/` :**
- **OWNER/ADMIN** : Voient TOUS les tickets de TOUS les services
- **STAFF** : Voient uniquement les tickets des services de leurs postes assignés

**Page `/call/[idPoste]` :**
- Le staff accède à son poste assigné
- Voit le ticket en cours ou appelle le prochain ticket PENDING
- Le ticket est assigné au poste : `postId` = ID du poste
- Le statut change : `PENDING` → `CALL` → `IN_PROGRESS` → `FINISHED`

## 🔧 Modifications techniques

### 1. Schéma Prisma

**Ajout de la relation Post → Service :**

```prisma
model Service {
  id        String   @id @default(uuid())
  name      String
  avgTime   Int
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  posts     Post[]   // Relation inverse
  tickets   Ticket[]
}

model Post {
  id            String   @id @default(uuid())
  name          String
  companyId     String
  serviceId     String   // NOUVEAU : Lien vers le service
  createdAt     DateTime @default(now())
  company       Company  @relation(fields: [companyId], references: [id])
  service       Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  tickets       Ticket[]
  assignedStaff Staff[]
}
```

**Migration :** `20260304143155_add_post_service_relation`
- Ajoute `serviceId` dans la table `Post`
- Pour les postes existants, assigne automatiquement le premier service de l'entreprise

### 2. Server Actions modifiées

**`createPost(email, postName, serviceId)` :**
```typescript
// Maintenant exige un serviceId
// Vérifie que le service appartient à l'entreprise
await prisma.post.create({
  data: {
    name: postName,
    companyId: company.id,
    serviceId: serviceId  // NOUVEAU
  }
})
```

**`getPendingTicketsByEmail(email)` :**
```typescript
// Si STAFF, récupère les services de ses postes assignés
const assignedServiceIds = [...new Set(
  staff?.assignedPosts.map(post => post.serviceId) || []
)]

// Filtre les services au lieu des postes
const company = await prisma.company.findUnique({
  include: {
    services: {
      where: role === 'STAFF' ? {
        id: { in: assignedServiceIds }
      } : {}
    }
  }
})
```

**`getLastTicketByEmail(email, idPoste)` :**
```typescript
// Vérifie que le STAFF a accès au poste demandé
if (role === 'STAFF') {
  const hasAccess = staff?.assignedPosts.some(post => post.id === idPoste)
  if (!hasAccess) {
    throw new Error('Vous n\'avez pas accès à ce poste')
  }
}
```

### 3. UI modifiée

**`/poste_list/page.tsx` :**
- Ajout d'un `<select>` pour choisir le service
- Récupère la liste des services via `getServiceByEmail()`
- Le bouton "Créer le poste" est désactivé si aucun service n'est sélectionné

```tsx
<select value={selectedServiceId} onChange={...}>
  <option value="" disabled>Sélectionner un service</option>
  {services.map(service => (
    <option key={service.id} value={service.id}>
      {service.name}
    </option>
  ))}
</select>
```

## 🎯 Avantages de cette architecture

### 1. **Logique métier claire**
- Un poste traite les tickets d'UN SEUL service
- Un staff assigné à un poste voit automatiquement les tickets de ce service
- Pas de confusion : chaque ticket appartient à un service précis

### 2. **Filtrage automatique et intelligent**
- Les STAFF voient tous les tickets PENDING de leurs services (file commune)
- Flexibilité : si plusieurs postes traitent le même service, n'importe quel staff peut prendre le prochain ticket
- Pas besoin de pré-assigner les tickets à des postes spécifiques

### 3. **Scalabilité**
- Facile d'ajouter de nouveaux services
- Facile d'ajouter de nouveaux postes pour un service existant
- Facile de réassigner des staff entre postes

### 4. **Sécurité renforcée**
- Les STAFF ne peuvent accéder qu'aux postes qui leur sont assignés
- Les STAFF ne voient que les tickets de leurs services
- Validation stricte à chaque niveau (service → poste → staff)

## 📊 Exemples concrets

### Exemple 1 : Cabinet médical

**Configuration :**
- Service 1 : "Consultation générale" (temps moyen : 15 min)
  - Poste A : "Cabinet Dr. Martin"
    - Staff : Dr. Martin
  - Poste B : "Cabinet Dr. Dubois"
    - Staff : Dr. Dubois
- Service 2 : "Radiologie" (temps moyen : 30 min)
  - Poste C : "Salle Radio 1"
    - Staff : Technicien 1
  - Poste D : "Salle Radio 2"
    - Staff : Technicien 2

**Workflow :**
1. Client choisit "Consultation générale" → Ticket créé
2. Dr. Martin ou Dr. Dubois peuvent prendre ce ticket (même service)
3. Client choisit "Radiologie" → Ticket créé
4. Seuls Technicien 1 ou Technicien 2 peuvent prendre ce ticket

### Exemple 2 : Agence administrative

**Configuration :**
- Service 1 : "Demande de passeport"
  - Poste 1 : "Guichet A"
    - Staff : Agent 1, Agent 2
  - Poste 2 : "Guichet B"
    - Staff : Agent 3
- Service 2 : "Demande de carte d'identité"
  - Poste 3 : "Guichet C"
    - Staff : Agent 4

**Workflow :**
1. Client demande un passeport → Ticket créé
2. Agent 1, 2 ou 3 peuvent traiter (tous ont accès au service "Passeport")
3. Client demande une carte d'identité → Ticket créé
4. Seul Agent 4 peut traiter (seul à avoir accès à ce service)

## 🧪 Tests recommandés

### Test 1 : Création de poste avec service

1. Crée un service "Test Service"
2. Va sur `/poste_list`
3. Vérifie que le dropdown affiche "Test Service"
4. Crée un poste "Test Poste" lié à "Test Service"
5. Vérifie dans Prisma Studio que le poste a bien un `serviceId`

### Test 2 : Filtrage des tickets pour STAFF

1. Crée 2 services : "Service A" et "Service B"
2. Crée 2 postes : "Poste A" (Service A) et "Poste B" (Service B)
3. Ajoute un STAFF et assigne-le uniquement au "Poste A"
4. Crée des tickets pour les deux services
5. Connecte-toi en tant que STAFF
6. Vérifie que tu vois uniquement les tickets du "Service A"

### Test 3 : Accès aux postes pour STAFF

1. STAFF assigné au "Poste A"
2. Essaye d'accéder à `/call/[idPosteA]` → ✅ Accès autorisé
3. Essaye d'accéder à `/call/[idPosteB]` → ❌ Erreur "Vous n'avez pas accès à ce poste"

## 🚀 Prochaines améliorations possibles

1. **Afficher le service dans la liste des postes** : Ajouter une colonne "Service" dans `/poste_list`
2. **Statistiques par service** : Nombre de tickets traités par service
3. **Réassignation de service** : Permettre de changer le service d'un poste existant
4. **Multi-services par poste** : Permettre à un poste de traiter plusieurs services (relation many-to-many)

---

**Cette architecture est maintenant implémentée et prête à être testée !** 🎉
