# SmartQueue ISS/KIN
## Système de Gestion de Files d'Attente — Institut Supérieur des Statistiques de Kinshasa

> Dossier de conception — Projet Tutoré  
> Spécialisation entreprise d'un système SaaS de gestion de files d'attente  
> Avril 2026

---

## Table des matières

1. [Contexte et redéfinition du projet](#1-contexte-et-redéfinition-du-projet)
2. [Acteurs du système](#2-acteurs-du-système)
3. [Cas d'utilisation principaux](#3-cas-dutilisation-principaux)
4. [Architecture système](#4-architecture-système)
5. [Modèle de données](#5-modèle-de-données)
6. [Flux métier principaux](#6-flux-métiers-principaux)
7. [Apports opérationnels et expérience étudiant](#7-apports-opérationnels-et-expérience-étudiant)
8. [Différenciation SaaS générique → Système d'entreprise universitaire](#8-différenciation-saas-générique--système-dentreprise-universitaire)

---

## 1. Contexte et redéfinition du projet

### 1.1 Situation initiale

SmartQueue a été conçu comme une **plateforme SaaS multi-tenant** permettant à n'importe quelle entreprise de déployer un système de gestion de files d'attente. Chaque organisation (client SaaS) dispose de ses propres services, postes de travail et employés, isolés des autres organisations.

### 1.2 Redéfinition pour ISS/KIN

Dans le cadre de ce projet tutoré, le système est **spécialisé pour un contexte mono-organisation** : l'**Institut Supérieur des Statistiques de Kinshasa (ISS/KIN)**. Au lieu de gérer plusieurs entreprises clientes, le système gère les **services administratifs et pédagogiques** d'une seule institution universitaire.

| Concept SaaS générique | Équivalent ISS/KIN |
|---|---|
| Organisation (Company) | ISS/KIN (instance unique) |
| Service | Département/Service administratif (Scolarité, Bibliothèque, Finance...) |
| Poste de travail | Guichet / Bureau de traitement |
| Ticket | Demande de service étudiant |
| Employé (Staff) | Agent administratif ou enseignant référent |
| OWNER | Direction / DSI (Administrateur système) |
| ADMIN | Responsable de service (Chef de département) |
| STAFF | Agent administratif de guichet |
| Client final | Étudiant |
| URL publique | Écran d'affichage en salle d'attente |

### 1.3 Périmètre fonctionnel

Le système couvre les services administratifs récurrents d'une université :

- **Scolarité** — inscriptions, réinscriptions, relevés de notes, attestations
- **Finance** — paiement des frais académiques, quittances
- **Bibliothèque** — prêt de documents, réservations
- **Orientation** — conseil académique, validation de parcours
- **Examens** — dépôt de sujets, affichage des résultats, réclamations
- **DSI / Informatique** — comptes étudiants, accès réseau

---

## 2. Acteurs du système

### 2.1 Diagramme des acteurs (description textuelle UML)

```
┌─────────────────────────────────────────────────────────┐
│                     Système ISS/KIN                     │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Étudiant   │    │    Agent     │                  │
│  │  (externe)   │    │ administratif│                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                  │                           │
│  ┌──────┴───────┐    ┌──────┴───────┐                  │
│  │  Responsable │    │   Admin DSI  │                  │
│  │  de service  │    │  (Directeur) │                  │
│  └──────────────┘    └──────────────┘                  │
│                                                         │
│  ┌──────────────┐                                       │
│  │  Utilisateur │  (écran public, lecture seule)        │
│  │    public    │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Description détaillée des acteurs

#### Étudiant
- **Qui** : tout étudiant inscrit à l'ISS/KIN
- **Accès** : via URL publique partagée (sans compte requis) ou compte étudiant
- **Actions** : prendre un ticket pour un service, consulter sa position dans la file, recevoir son numéro d'appel, prendre un rendez-vous

#### Agent administratif (STAFF)
- **Qui** : agent de guichet assigné à un ou plusieurs postes
- **Accès** : compte Clerk avec rôle STAFF
- **Actions** : voir les tickets de ses postes assignés, appeler le ticket suivant, marquer un ticket comme traité, suspendre un ticket

#### Responsable de service (ADMIN)
- **Qui** : chef de département ou responsable administratif
- **Accès** : compte Clerk avec rôle ADMIN
- **Actions** : créer/modifier les services de son département, gérer les postes, affecter les agents, consulter les statistiques de son service

#### Administrateur système (OWNER)
- **Qui** : Direction ou DSI de l'ISS/KIN
- **Accès** : compte Clerk avec rôle OWNER
- **Actions** : configuration globale du système, gestion de tous les utilisateurs, accès aux analytiques globaux, définition de l'URL publique institutionnelle

#### Utilisateur public (anonyme)
- **Qui** : toute personne dans la salle d'attente
- **Accès** : écran de display projeté en salle (URL `/display/[pageName]`)
- **Actions** : voir en temps réel les numéros appelés et les guichets actifs

---

## 3. Cas d'utilisation principaux

### 3.1 Vue d'ensemble (UML Use Case — description textuelle)

```
Acteur: Étudiant
  UC01 — Prendre un ticket de service
  UC02 — Consulter sa position en file d'attente
  UC03 — Recevoir la confirmation d'appel (affichage)
  UC04 — Prendre un rendez-vous (RDV planifié)

Acteur: Agent administratif
  UC05 — Consulter les tickets de son poste
  UC06 — Appeler le ticket suivant
  UC07 — Marquer un ticket comme traité / annuler
  UC08 — Suspendre un ticket (temporairement)

Acteur: Responsable de service
  UC09 — Créer / modifier un service
  UC10 — Créer / modifier un poste de travail
  UC11 — Assigner un agent à un poste
  UC12 — Consulter les statistiques du service

Acteur: Administrateur système
  UC13 — Gérer les comptes utilisateurs (agents, responsables)
  UC14 — Configurer l'URL publique institutionnelle
  UC15 — Consulter les analytiques globaux
  UC16 — Configurer les paramètres système

Acteur: Utilisateur public
  UC17 — Visualiser l'affichage de la file d'attente en temps réel
```

### 3.2 Description des cas d'utilisation critiques

#### UC01 — Prendre un ticket de service

| Champ | Détail |
|---|---|
| Acteur principal | Étudiant |
| Précondition | Le service est ouvert et actif |
| Déclencheur | L'étudiant accède à l'URL publique de l'ISS/KIN |
| Scénario nominal | 1. L'étudiant visite `iss-kin.smartqueue.app/queue` → 2. Il sélectionne un service (ex : Scolarité) → 3. Il saisit son nom et numéro matricule → 4. Le système génère un numéro de ticket unique → 5. L'étudiant reçoit son numéro et sa position estimée |
| Postcondition | Le ticket est créé et visible dans la file de l'agent |
| Exceptions | Service complet → message d'erreur ; Données invalides → validation côté serveur |

#### UC06 — Appeler le ticket suivant

| Champ | Détail |
|---|---|
| Acteur principal | Agent administratif |
| Précondition | L'agent est connecté et affecté à un poste actif |
| Déclencheur | L'agent clique sur "Appeler le suivant" |
| Scénario nominal | 1. Le système identifie le ticket suivant selon la priorité → 2. L'écran public est mis à jour en temps réel (polling 5s) → 3. Le ticket passe au statut "En cours" → 4. L'agent traite la demande → 5. Il clique sur "Terminé" → 6. Le ticket est archivé |
| Postcondition | Le ticket est marqué traité ; les statistiques sont mises à jour |

#### UC12 — Consulter les statistiques du service

| Champ | Détail |
|---|---|
| Acteur principal | Responsable de service |
| Précondition | Le responsable est authentifié avec rôle ADMIN ou OWNER |
| Données affichées | Tickets traités / jour, temps moyen de traitement, taux d'attente par service, heures de pic |

---

## 4. Architecture système

### 4.1 Architecture globale (3 tiers)

```
┌─────────────────────────────────────────────────────────────────┐
│                        TIER PRÉSENTATION                        │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │  App Next.js    │  │  Écran display   │  │  Mobile       │  │
│  │  (Dashboard     │  │  /display/[page] │  │  (responsive) │  │
│  │   admin/agent)  │  │  Temps réel      │  │               │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────┬────────┘  │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │                     │                    │
┌───────────┼─────────────────────┼────────────────────┼──────────┐
│                         TIER LOGIQUE MÉTIER                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js Server Actions (API layer)          │   │
│  │                                                          │   │
│  │  initUserSession │ createTicket │ getPendingTickets      │   │
│  │  createService   │ createPost   │ manageStaff            │   │
│  │  getAnalytics    │ updateTicket │ getSetupStatus         │   │
│  └──────────────────────────────┬───────────────────────────┘   │
│                                 │                               │
│  ┌──────────────────────────────┼───────────────────────────┐   │
│  │              Couche sécurité & validation                 │   │
│  │  Clerk Auth │ Zod Schemas │ Rate Limiting │ OWASP guards  │   │
│  └──────────────────────────────┬───────────────────────────┘   │
└───────────────────────────────────┼─────────────────────────────┘
                                    │
┌───────────────────────────────────┼─────────────────────────────┐
│                          TIER DONNÉES                           │
│                                                                 │
│  ┌─────────────────────┐    ┌────────────────────────────────┐  │
│  │   PostgreSQL        │    │   Clerk (Auth externe)         │  │
│  │   (Neon DB cloud)   │    │   Gestion identités            │  │
│  │   via Prisma ORM    │    │   SSO possible (SAML/OIDC)     │  │
│  └─────────────────────┘    └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Stack technique

| Couche | Technologie | Justification |
|---|---|---|
| Frontend | Next.js 14 + React 18 | SSR/SSG, App Router, performance |
| Styling | Tailwind CSS + DaisyUI | Cohérence UI, accessibilité WCAG |
| Authentification | Clerk | JWT sécurisé, multi-rôles, SSO-ready |
| Backend | Next.js Server Actions | API type-safe sans serveur séparé |
| ORM | Prisma | Typage fort, migrations, PostgreSQL |
| Base de données | PostgreSQL (Neon) | ACID, relationnel, JSON support |
| Temps réel | Polling SSE (5s) | Simple, scalable, sans WebSocket dédié |
| Validation | Zod | Validation runtime côté serveur |
| Rate Limiting | Upstash Redis | Protection DDoS, quotas par action |
| Déploiement | Vercel + Neon | CI/CD, serverless, edge |

### 4.3 Sécurité by design

```
Toutes les Server Actions appliquent systématiquement :

1. verifyCompanyOwnership(email)   → vérifie que l'appelant est bien OWNER
2. emailSchema.parse(email)        → validation Zod stricte
3. checkRateLimit(key, limit, ms)  → anti-abus par action
4. Principe du moindre privilège   → STAFF ne voit que ses postes
5. Variables d'environnement       → aucune clé en dur dans le code
6. HTTPS forcé en production       → Clerk + Vercel
```

---

## 5. Modèle de données

### 5.1 Entités principales

```
┌─────────────────────────────────────────────────────────────────┐
│                        MODÈLE ENTITÉ-RELATION                   │
│                                                                 │
│  ┌───────────────┐         ┌──────────────────┐                │
│  │   Company     │ 1     N │    Service       │                │
│  │  (ISS/KIN)   ├─────────┤  (Scolarité,     │                │
│  │               │         │   Finance, ...)  │                │
│  │ - id          │         │                  │                │
│  │ - name        │         │ - id             │                │
│  │ - email       │         │ - name           │                │
│  │ - pageName    │         │ - avgTime        │                │
│  │ - createdAt   │         │ - companyId      │                │
│  └───────┬───────┘         └────────┬─────────┘                │
│          │                          │                          │
│          │ 1                        │ 1                        │
│          │                          │                          │
│          │ N                        │ N                        │
│  ┌───────┴───────┐         ┌────────┴─────────┐                │
│  │    Staff      │         │      Post        │                │
│  │  (Agents,     │ N     N │  (Guichets,      │                │
│  │  Responsables)├─────────┤   Bureaux)       │                │
│  │               │ assigné │                  │                │
│  │ - id          │ à       │ - id             │                │
│  │ - name        │         │ - name           │                │
│  │ - email       │         │ - serviceId      │                │
│  │ - role        │         │ - companyId      │                │
│  │ - companyId   │         └────────┬─────────┘                │
│  └───────────────┘                  │                          │
│                                     │ 1                        │
│                                     │                          │
│                                     │ N                        │
│                           ┌─────────┴────────┐                 │
│                           │     Ticket       │                 │
│                           │  (Demandes       │                 │
│                           │   étudiantes)    │                 │
│                           │                  │                 │
│                           │ - id             │                 │
│                           │ - number         │                 │
│                           │ - customerName   │                 │
│                           │ - status         │                 │
│                           │ - priority       │                 │
│                           │ - serviceId      │                 │
│                           │ - createdAt      │                 │
│                           └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Schéma Prisma annoté (contexte universitaire)

```prisma
// Company → représente l'ISS/KIN (instance unique)
model Company {
  id        String   @id @default(cuid())
  name      String                          // "Institut Supérieur des Statistiques de Kinshasa"
  email     String   @unique               // email institutionnel de l'admin DSI
  pageName  String?  @unique               // slug URL publique ex: "iss-kin"
  createdAt DateTime @default(now())

  services Service[]
  posts    Post[]
  staff    Staff[]
}

// Service → département/service administratif de l'université
model Service {
  id        String   @id @default(cuid())
  name      String                          // "Scolarité", "Finance", "Bibliothèque"
  avgTime   Int                             // temps moyen de traitement en minutes
  companyId String

  company   Company  @relation(fields: [companyId], references: [id])
  posts     Post[]
  tickets   Ticket[]
}

// Post → guichet ou bureau de traitement
model Post {
  id        String   @id @default(cuid())
  name      String                          // "Guichet 1 - Scolarité", "Bureau RH"
  serviceId String
  companyId String

  service       Service  @relation(fields: [serviceId], references: [id])
  company       Company  @relation(fields: [companyId], references: [id])
  assignedStaff Staff[]  @relation("StaffPosts")
}

// Staff → agents administratifs et responsables
model Staff {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  role          Role                        // ADMIN (responsable) | STAFF (agent guichet)
  companyId     String

  company       Company  @relation(fields: [companyId], references: [id])
  assignedPosts Post[]   @relation("StaffPosts")
}

enum Role { ADMIN STAFF }

// Ticket → demande de service d'un étudiant
model Ticket {
  id           String       @id @default(cuid())
  number       Int                           // numéro d'ordre affiché: ex. 042
  customerName String                        // nom de l'étudiant
  status       TicketStatus @default(PENDING)
  priority     Priority     @default(NORMAL)
  isVirtual    Boolean      @default(false) // ticket pris en ligne vs présentiel
  avgTime      Int                          // copié depuis Service au moment de la création
  distance     Float?                       // distance estimée si ticket virtuel (km)
  serviceId    String
  createdAt    DateTime     @default(now())

  service      Service      @relation(fields: [serviceId], references: [id])
}

enum TicketStatus { PENDING CALLED IN_PROGRESS COMPLETED CANCELLED }
enum Priority    { LOW NORMAL HIGH URGENT }
```

### 5.3 Extensions possibles pour le contexte universitaire

```prisma
// Extension proposée : Étudiant avec matricule
model Student {
  id         String   @id @default(cuid())
  matricule  String   @unique               // ex: ISS2024-0042
  name       String
  email      String?
  promotion  String                         // ex: "L2 Statistiques 2024-2025"
  companyId  String

  tickets    Ticket[]
}

// Extension proposée : Horaires d'ouverture des services
model ServiceSchedule {
  id        String  @id @default(cuid())
  serviceId String
  dayOfWeek Int                             // 0=Lundi ... 6=Dimanche
  openTime  String                          // "08:00"
  closeTime String                          // "16:00"
  isClosed  Boolean @default(false)
}

// Extension proposée : Historique et analytiques
model TicketHistory {
  id            String   @id @default(cuid())
  ticketId      String
  serviceId     String
  waitDuration  Int                         // en secondes
  treatDuration Int                         // en secondes
  agentId       String
  date          DateTime @default(now())
}
```

---

## 6. Flux métiers principaux

### 6.1 Flux : Étudiant prend un ticket

```
Étudiant                  Système                      Agent
   │                         │                           │
   │── Accède URL publique ──>│                           │
   │                         │── Affiche services ──────>│
   │<── Liste des services ──│                           │
   │                         │                           │
   │── Sélectionne service ─>│                           │
   │── Saisit son nom ───────>│                           │
   │                         │── Valide (Zod) ──────────>│
   │                         │── Crée ticket en DB ──────>│
   │                         │── Attribue numéro ─────────│
   │<── Numéro + position ───│                           │
   │                         │                           │
   │   (attend en salle)     │── Polling 5s ────────────>│
   │                         │<── Ticket suivant ────────│
   │<── Écran: "N°042 →     │                           │
   │    Guichet 2" ──────────│                           │
```

### 6.2 Flux : Appel temps réel (écran public)

```
Dashboard Agent              Server Actions              Écran public
     │                            │                           │
     │── "Appeler suivant" ──────>│                           │
     │                            │── UPDATE ticket.status    │
     │                            │   = CALLED               │
     │<── Ticket affiché ─────────│                           │
     │                            │                           │
     │                            │   (polling 5s)            │
     │                            │<── getPendingTickets() ──│
     │                            │── Retourne liste mise à   │
     │                            │   jour ──────────────────>│
     │                            │                           │
     │                            │                           │
```

---

## 7. Apports opérationnels et expérience étudiant

### 7.1 Problèmes actuels sans le système

| Problème observé | Impact |
|---|---|
| Files physiques non organisées | Agglutinement, tensions, perte de temps |
| Aucune estimation du temps d'attente | Frustration, abandons |
| Absence de traçabilité des demandes | Litiges, perte de dossiers |
| Distribution manuelle des tickets | Erreurs, favoritisme perçu |
| Aucun indicateur de performance | Impossible d'optimiser les ressources |
| Agents surchargés sans visibilité | Stress, qualité de service dégradée |

### 7.2 Gains mesurables avec SmartQueue ISS/KIN

| Indicateur | Avant | Après (estimé) |
|---|---|---|
| Temps d'attente moyen | 45-90 min | 15-30 min (-60%) |
| Tickets traités/agent/heure | 4-6 | 8-12 (+80%) |
| Taux de satisfaction étudiant | Non mesuré | Mesurable via feedback |
| Conflits en file d'attente | Fréquents | Quasi nuls |
| Temps de réponse aux pics | Réactif manuel | Anticipation par analytics |
| Traçabilité des demandes | 0% | 100% (historique DB) |

### 7.3 Bénéfices par acteur

**Pour l'étudiant**
- Ticket pris en ligne depuis son smartphone → zéro déplacement inutile
- Estimation du temps d'attente visible sur écran public
- Numéro unique → traitement équitable garanti
- Ticket virtuel avec géolocalisation estimée (arrive juste à temps)

**Pour l'agent administratif**
- Interface claire montrant uniquement ses tickets assignés
- Un clic pour appeler le suivant → fluidité maximale
- Visibilité sur la charge de travail restante
- Historique complet des interactions

**Pour la direction / DSI**
- Dashboard analytics : heures de pointe, services engorgés, temps de traitement
- Identification des agents les plus/moins performants
- Données pour justifier l'ouverture de guichets supplémentaires
- Conformité et auditabilité complète

---

## 8. Différenciation SaaS générique → Système d'entreprise universitaire

### 8.1 Tableau comparatif

| Dimension | SaaS générique | SmartQueue ISS/KIN |
|---|---|---|
| **Multi-tenant** | Oui — N organisations isolées | Non — 1 organisation, multi-services |
| **Public cible** | Toute entreprise abonnée | Étudiants ISS/KIN uniquement |
| **Modèle économique** | Abonnement mensuel par org. | Déployé en interne, coût unique |
| **Onboarding** | Auto-service (inscription libre) | Contrôlé par la DSI |
| **Authentification** | Email/OAuth générique | Extensible vers SSO institutionnel (LDAP/CAS) |
| **Données** | Isolées par tenant | Centralisées, exploitables pour rapports institutionnels |
| **Personnalisation** | Limitée par le SaaS | Adaptable aux processus métier de l'université |
| **Conformité** | RGPD générique | Conforme aux exigences DRC (données étudiants) |
| **Intégration SI** | Aucune | Connectable au SI universitaire (ERP, notes) |

### 8.2 Justification académique de la spécialisation

**Pourquoi ce n'est pas un simple SaaS "rebrandé"**

1. **Domaine métier spécifique** : les services universitaires ont des règles propres (priorité aux étudiants finissants, sessions d'inscription limitées dans le temps, gestion des pics de rentrée)

2. **Acteurs redéfinis** : un étudiant n'est pas un "client" commercial — il a un matricule, une promotion, un cursus. Ces attributs influencent la logique de priorité

3. **Intégration institutionnelle** : le système est conçu pour s'interfacer avec l'existant de l'ISS/KIN (listes d'étudiants, calendriers académiques, résultats d'examens)

4. **Gouvernance des données** : dans un SaaS, chaque tenant gère ses propres données. Ici, la direction de l'ISS/KIN est le seul décideur sur la politique de données — plus de contrôle, plus de responsabilité

5. **Scalabilité verticale vs horizontale** : le SaaS scale horizontalement (plus de clients). Ce système scale verticalement (plus de services, plus d'agents, plus d'étudiants dans la même institution)

### 8.3 Alignement avec les bonnes pratiques du génie logiciel

| Pratique | Implémentation |
|---|---|
| **Architecture en couches** | Présentation / Logique métier (Server Actions) / Données (Prisma) |
| **Séparation des responsabilités** | Un composant = une responsabilité (SRP) |
| **Validation à tous les niveaux** | Zod (serveur) + HTML5 (client) |
| **Sécurité by design** | Authentification, autorisation, rate limiting intégrés dès la conception |
| **Maintenabilité** | TypeScript end-to-end, Prisma typé, composants réutilisables |
| **Testabilité** | Server Actions pures (entrée/sortie prévisibles), pas de side effects non contrôlés |
| **Documentation** | Code autodocumenté + ce dossier + DOCUMENTATION_TECHNIQUE.md |
| **Déploiement continu** | CI/CD via GitHub Actions + Vercel |

---

## Annexe A — Glossaire

| Terme | Définition dans le contexte ISS/KIN |
|---|---|
| **Ticket** | Numéro d'ordre numérique attribué à un étudiant pour un service donné |
| **Poste** | Bureau ou guichet physique où un agent traite les demandes |
| **Service** | Entité administrative (Scolarité, Finance, Bibliothèque...) regroupant des postes |
| **File d'attente** | Liste ordonnée des tickets en attente pour un service donné |
| **Ticket virtuel** | Ticket pris à distance (smartphone) — l'étudiant n'est pas encore sur place |
| **Écran public** | Affichage temps réel projeté en salle d'attente (URL de display) |
| **pageName** | Slug URL unique de l'institution (ex: `iss-kin`) servant d'identifiant public |
| **avgTime** | Durée moyenne estimée de traitement d'un service, en minutes |
| **OWNER** | Compte DSI/Direction — configuration globale du système |
| **ADMIN** | Responsable de service — gestion de son département |
| **STAFF** | Agent de guichet — traitement des tickets de ses postes assignés |

---

## Annexe B — Roadmap d'évolution proposée

| Phase | Fonctionnalité | Priorité |
|---|---|---|
| V1 (actuel) | File d'attente, tickets, affichage temps réel | ✅ Livré |
| V1.1 | Tickets virtuels avec QR code | ✅ Livré |
| V1.2 | Rendez-vous planifiés | ✅ Livré |
| V2.0 | Authentification matricule étudiant | 🔜 Planifié |
| V2.1 | Notifications SMS/WhatsApp (appel imminent) | 🔜 Planifié |
| V2.2 | Analytics avancés (tableau de bord direction) | 🔜 Planifié |
| V3.0 | Intégration SI universitaire (ERP/notes) | 💡 Vision |
| V3.1 | Application mobile dédiée (iOS/Android) | 💡 Vision |
| V3.2 | SSO institutionnel (LDAP / Microsoft Entra ID) | 💡 Vision |

---

*Document rédigé dans le cadre du Projet Tutoré — SmartQueue ISS/KIN — Avril 2026*
