# SmartQueue - Système de Gestion de File d'Attente

## Table des matières
- [Vue d'ensemble](#vue-densemble)
- [Architecture](#architecture)
- [Technologies utilisées](#technologies-utilisées)
- [Dépendances](#dépendances)
- [Installation](#installation)
- [Configuration](#configuration)
- [Mode d'emploi](#mode-demploi)
- [Gestion des rôles](#gestion-des-rôles)
- [Workflow complet](#workflow-complet)
- [Structure du projet](#structure-du-projet)
- [Sécurité et performances](#sécurité-et-performances)

## Vue d'ensemble

**SmartQueue** est une application web moderne de gestion de files d'attente multi-services. Elle permet aux entreprises de gérer efficacement leurs clients à travers différents services, postes de travail et membres du personnel.

### Fonctionnalités principales
- ✅ **Gestion multi-services** : Créez et gérez plusieurs services avec temps de traitement personnalisés
- ✅ **Système de postes** : Assignez des postes de travail spécifiques à chaque service
- ✅ **Gestion du personnel** : Ajoutez des employés avec différents rôles (OWNER, ADMIN, STAFF)
- ✅ **Attribution intelligente** : Les employés voient uniquement les tickets de leurs services assignés
- ✅ **Interface client publique** : Page personnalisée pour la création de tickets par les clients
- ✅ **Temps réel** : Mise à jour automatique des tickets toutes les 5 secondes
- ✅ **Authentification sécurisée** : Intégration Clerk pour une gestion d'utilisateurs robuste
- ✅ **Rate limiting** : Protection contre les abus avec Upstash Redis

---

## 🏗️ Architecture

### Hiérarchie des entités

```
Entreprise (Company)
  │
  ├─ Service 1 (ex: "Consultation médicale")
  │   ├─ Poste A (ex: "Cabinet Dr. Martin")
  │   │   └─ Staff 1, Staff 2
  │   └─ Poste B (ex: "Cabinet Dr. Dubois")
  │       └─ Staff 3
  │
  └─ Service 2 (ex: "Radiologie")
      ├─ Poste C (ex: "Salle Radio 1")
      │   └─ Staff 4
      └─ Poste D (ex: "Salle Radio 2")
          └─ Staff 5
```

### Relations clés
- **Service → Poste** : Un poste est lié à UN SEUL service
- **Poste → Staff** : Relation many-to-many (un staff peut gérer plusieurs postes)
- **Service → Ticket** : Un ticket est créé pour un service spécifique
- **Poste → Ticket** : Un ticket est assigné à un poste lors de son traitement

### Cycle de vie d'un ticket

```
1. Client crée ticket → PENDING (serviceId défini, postId = null)
2. Staff appelle ticket → CALL (postId assigné)
3. Staff traite ticket → IN_PROGRESS
4. Staff termine ticket → FINISHED
```

---

## 💻 Technologies utilisées

### Frontend
- **Next.js 16.1.6** (App Router) - Framework React avec rendu côté serveur
- **React 19.2.3** - Bibliothèque UI
- **TailwindCSS 4** - Framework CSS utilitaire
- **DaisyUI 5.5.14** - Composants UI pré-stylisés
- **Lucide React** - Icônes modernes

### Backend
- **Next.js Server Actions** - API serverless intégrée
- **Prisma 7.3.0** - ORM pour la base de données
- **SQLite** (dev) / **PostgreSQL** (production) - Base de données
- **Zod 4.3.6** - Validation de schémas TypeScript

### Authentification & Sécurité
- **Clerk 6.37.0** - Authentification et gestion d'utilisateurs
- **Upstash Redis** - Rate limiting distribué
- **Upstash Ratelimit 2.0.8** - Middleware de limitation de requêtes

### Temps réel
- **Socket.io 4.8.3** - Communication WebSocket bidirectionnelle
- **Polling HTTP** - Mise à jour automatique toutes les 5 secondes

### Développement
- **TypeScript 5** - Typage statique
- **ESLint 9** - Linter JavaScript/TypeScript
- **tsx 4.21.0** - Exécution TypeScript pour le serveur WebSocket

---

## 📦 Dépendances

### Production
```json
{
  "@clerk/nextjs": "^6.37.0",
  "@prisma/client": "^7.3.0",
  "@upstash/ratelimit": "^2.0.8",
  "@upstash/redis": "^1.36.3",
  "lucide-react": "^0.563.0",
  "next": "16.1.6",
  "react": "19.2.3",
  "socket.io": "^4.8.3",
  "zod": "^4.3.6"
}
```

### Développement
```json
{
  "@tailwindcss/postcss": "^4",
  "daisyui": "^5.5.14",
  "eslint": "^9",
  "prisma": "^7.3.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## 🚀 Installation

### Prérequis
- Node.js 20+ 
- npm ou yarn
- Compte Clerk (gratuit)
- Compte Upstash Redis (gratuit)

### Étapes

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd smart_queue
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine :

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Database (SQLite en dev, PostgreSQL en prod)
DATABASE_URL="file:./dev.db"
# Pour PostgreSQL : DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

4. **Initialiser la base de données**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Lancer le serveur de développement**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

6. **(Optionnel) Lancer le serveur WebSocket**
```bash
npm run socket-server
```

---

## ⚙️ Configuration

### Clerk Authentication

1. Créez un compte sur [clerk.com](https://clerk.com)
2. Créez une nouvelle application
3. Copiez les clés API dans `.env`
4. Configurez les URLs de redirection :
   - Sign-in URL : `/sign-in`
   - Sign-up URL : `/sign-up`
   - After sign-in : `/`

### Upstash Redis

1. Créez un compte sur [upstash.com](https://upstash.com)
2. Créez une base Redis
3. Copiez `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` dans `.env`

### Base de données

**Développement (SQLite)**
```env
DATABASE_URL="file:./dev.db"
```

**Production (PostgreSQL)**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Après modification, exécutez :
```bash
npx prisma migrate deploy
npx prisma generate
```

---

## 📖 Mode d'emploi

### 1️⃣ Configuration initiale (OWNER)

#### Étape 1 : Créer des services
1. Connectez-vous avec votre email (vous devenez automatiquement OWNER)
2. Allez sur **"Vos services"** (`/services`)
3. Cliquez sur **"Créer un service"**
4. Renseignez :
   - Nom du service (ex: "Consultation médicale")
   - Temps moyen de traitement en minutes (ex: 15)
5. Répétez pour tous vos services

#### Étape 2 : Créer des postes
1. Allez sur **"Vos postes"** (`/poste_list`)
2. Sélectionnez un service dans le dropdown
3. Entrez le nom du poste (ex: "Cabinet A")
4. Cliquez sur **"Créer le poste"**
5. Le poste est automatiquement lié au service choisi

#### Étape 3 : Ajouter des employés
1. Allez sur **"Gestion Staff"** (`/staff`)
2. Cliquez sur **"Ajouter un employé"**
3. Renseignez :
   - Email de l'employé
   - Nom complet
   - Rôle : **ADMIN** (accès complet) ou **STAFF** (accès limité)
4. Cliquez sur **"Ajouter"**

#### Étape 4 : Assigner des postes aux employés
1. Dans la liste des employés, cliquez sur **"Postes"**
2. Sélectionnez un poste dans le dropdown
3. Cliquez sur **"Assigner"**
4. L'employé voit maintenant les tickets de ce service

#### Étape 5 : Configurer la page publique
1. Cliquez sur l'icône **🌐** dans la navbar
2. Entrez un nom de page unique (ex: "cabinet-medical")
3. Votre page publique sera accessible sur `/page/cabinet-medical`

### 2️⃣ Utilisation client

1. Le client accède à `/page/[votre-nom-de-page]`
2. Il choisit un service dans la liste
3. Il entre son nom
4. Il clique sur **"Créer le ticket"**
5. Un numéro de ticket s'affiche (ex: **T20250305A4K9L**)
6. Le client attend son tour

### 3️⃣ Traitement des tickets (STAFF)

#### Vue d'ensemble
1. Connectez-vous avec l'email du STAFF
2. La page d'accueil affiche vos **postes assignés**
3. Cliquez sur un poste pour accéder à l'interface de traitement

#### Interface de traitement (`/call/[idPoste]`)
1. **Aucun ticket en cours** :
   - Cliquez sur **"Appeler le prochain ticket"**
   - Le premier ticket PENDING du service s'affiche
   - Le statut passe à **CALL**

2. **Ticket en cours** :
   - Cliquez sur **"Commencer le traitement"** → Statut **IN_PROGRESS**
   - Cliquez sur **"Terminer"** → Statut **FINISHED**
   - Le ticket disparaît de la file

3. **Annuler un appel** :
   - Cliquez sur **"Annuler l'appel"**
   - Le ticket retourne en **PENDING** (première position)

### 4️⃣ Tableau de bord (OWNER/ADMIN)

1. Allez sur **"Tableau de bord"** (`/dashboard`)
2. Visualisez :
   - Nombre total de tickets
   - Tickets par statut (PENDING, CALL, IN_PROGRESS, FINISHED)
   - Temps d'attente moyen
   - Graphiques de performance

---

## 👥 Gestion des rôles

### OWNER (Propriétaire)
**Accès complet** à toutes les fonctionnalités :
- ✅ Créer/modifier/supprimer des services
- ✅ Créer/modifier/supprimer des postes
- ✅ Ajouter/modifier/supprimer des employés
- ✅ Assigner/désassigner des postes aux employés
- ✅ Voir TOUS les tickets de TOUS les services
- ✅ Accéder au tableau de bord complet
- ✅ Configurer la page publique

**Navbar** : Accueil, Vos services, Vos postes, Gestion Staff, Tableau de bord

### ADMIN (Administrateur)
**Accès étendu** sans gestion du personnel :
- ✅ Créer/modifier/supprimer des services
- ✅ Créer/modifier/supprimer des postes
- ✅ Voir TOUS les tickets de TOUS les services
- ✅ Accéder au tableau de bord complet
- ❌ Pas d'accès à la gestion du personnel

**Navbar** : Accueil, Vos services, Vos postes, Tableau de bord

### STAFF (Employé)
**Accès limité** aux postes assignés :
- ✅ Voir uniquement les tickets des services de ses postes assignés
- ✅ Traiter les tickets sur ses postes assignés
- ❌ Pas d'accès aux services, postes, gestion du personnel
- ❌ Pas d'accès au tableau de bord

**Navbar** : Accueil uniquement

**Page d'accueil** : Grille des postes assignés avec accès direct

---

## 🔄 Workflow complet

### Scénario : Cabinet médical

#### Configuration (OWNER)
1. Crée 2 services :
   - "Consultation générale" (15 min)
   - "Radiologie" (30 min)

2. Crée 3 postes :
   - "Cabinet Dr. Martin" → Service "Consultation"
   - "Cabinet Dr. Dubois" → Service "Consultation"
   - "Salle Radio 1" → Service "Radiologie"

3. Ajoute 3 employés :
   - Dr. Martin (STAFF) → Assigné au "Cabinet Dr. Martin"
   - Dr. Dubois (STAFF) → Assigné au "Cabinet Dr. Dubois"
   - Technicien Radio (STAFF) → Assigné à "Salle Radio 1"

4. Configure la page publique : "cabinet-medical"

#### Utilisation (Client)
1. Client 1 accède à `/page/cabinet-medical`
2. Choisit "Consultation générale"
3. Entre son nom : "Jean Dupont"
4. Reçoit le ticket **T001**

5. Client 2 fait de même → Ticket **T002**
6. Client 3 choisit "Radiologie" → Ticket **T003**

#### Traitement (STAFF)
**Dr. Martin** :
1. Se connecte → Voit "Cabinet Dr. Martin"
2. Clique dessus → Accède à `/call/[idCabinet]`
3. Voit 2 tickets PENDING (T001, T002) du service "Consultation"
4. Appelle T001 → Jean Dupont
5. Traite et termine → T001 passe à FINISHED

**Dr. Dubois** :
1. Se connecte → Voit "Cabinet Dr. Dubois"
2. Peut également appeler T002 (même service)

**Technicien Radio** :
1. Se connecte → Voit "Salle Radio 1"
2. Voit uniquement T003 (service "Radiologie")
3. Ne voit PAS T001 et T002 (service différent)

---

## 📁 Structure du projet

```
smart_queue/
├── app/
│   ├── actions.ts                 # Server Actions (API serverless)
│   ├── page.tsx                   # Page d'accueil (dashboard ou postes assignés)
│   ├── layout.tsx                 # Layout global avec Clerk
│   ├── type.ts                    # Types TypeScript partagés
│   │
│   ├── components/
│   │   ├── Navbar.tsx             # Barre de navigation avec filtrage par rôle
│   │   ├── Wrapper.tsx            # Conteneur de page
│   │   ├── TicketComponent.tsx    # Affichage d'un ticket
│   │   └── SettingsModal.tsx      # Modal de configuration
│   │
│   ├── services/                  # Gestion des services
│   │   └── page.tsx
│   ├── poste_list/                # Gestion des postes
│   │   └── page.tsx
│   ├── staff/                     # Gestion du personnel
│   │   └── page.tsx
│   ├── dashboard/                 # Tableau de bord
│   │   └── page.tsx
│   ├── call/[idPoste]/            # Interface de traitement des tickets
│   │   └── page.tsx
│   ├── page/[pageName]/           # Page publique pour les clients
│   │   └── page.tsx
│   └── poste/[idPoste]/           # Détails d'un poste
│       └── page.tsx
│
├── lib/
│   ├── auth.ts                    # Helpers d'authentification
│   ├── prisma.ts                  # Instance Prisma singleton
│   ├── ratelimit.ts               # Configuration rate limiting
│   └── validation.ts              # Schémas Zod de validation
│
├── prisma/
│   ├── schema.prisma              # Schéma de base de données
│   └── migrations/                # Migrations SQL
│
├── public/                        # Assets statiques
├── .env                           # Variables d'environnement (à créer)
├── package.json                   # Dépendances npm
├── tsconfig.json                  # Configuration TypeScript
├── tailwind.config.ts             # Configuration TailwindCSS
└── README.md                      # Ce fichier
```

---

## 🔒 Sécurité et performances

### Authentification
- **Clerk** gère l'authentification complète (OAuth, email/password, 2FA)
- Vérification automatique de l'utilisateur connecté dans chaque Server Action
- Tokens JWT sécurisés avec rotation automatique

### Autorisation
- **`verifyCompanyOwnership(email)`** : Vérifie que l'utilisateur est OWNER de l'entreprise
- **`verifyStaffAccess()`** : Vérifie que l'utilisateur est STAFF et retourne ses infos
- Validation stricte des rôles à chaque niveau (Service → Poste → Staff)

### Rate Limiting
Configuration par action :
- **Création de service** : 5 par minute
- **Création de poste** : 10 par minute
- **Ajout d'employé** : 5 par minute
- **Création de ticket** : 10 par minute
- **Appel de ticket** : 20 par minute

### Validation des données
- **Zod** valide toutes les entrées utilisateur
- Schémas stricts pour email, noms, temps moyens, etc.
- Protection contre les injections SQL via Prisma ORM

### Optimisations
- **`initUserSession()`** : 1 seul appel serveur au lieu de 3 pour récupérer rôle + pageName
- **Polling intelligent** : Mise à jour toutes les 5 secondes uniquement si l'utilisateur est connecté
- **Cache localStorage** : Rôle utilisateur mis en cache pour éviter les flashs UI
- **Pagination** : 10 tickets par page sur le dashboard

---

## 🛠️ Commandes utiles

### Développement
```bash
npm run dev              # Lancer le serveur Next.js
npm run socket-server    # Lancer le serveur WebSocket
npm run lint             # Vérifier le code avec ESLint
```

### Base de données
```bash
npx prisma migrate dev   # Créer une nouvelle migration
npx prisma migrate deploy # Appliquer les migrations en production
npx prisma generate      # Générer le client Prisma
npx prisma studio        # Interface graphique de la BDD
npx prisma db push       # Synchroniser le schéma sans migration
```

### Production
```bash
npm run build            # Build de production
npm start                # Lancer en production
```

### TypeScript
```bash
npx tsc --noEmit         # Vérifier les erreurs TypeScript
```

---

## 📝 Notes importantes

### Migration SQLite → PostgreSQL
Pour passer en production avec PostgreSQL :

1. Modifiez `DATABASE_URL` dans `.env`
2. Exécutez :
```bash
npx prisma migrate deploy
npx prisma generate
```

### Gestion des migrations
- **Ne jamais modifier** une migration déjà appliquée
- **Toujours tester** les migrations en dev avant la prod
- **Sauvegarder** la base de données avant toute migration

### Personnalisation
- **Thèmes** : Modifiez `daisyui.themes` dans `tailwind.config.ts`
- **Temps de polling** : Modifiez `5000` (5s) dans `app/page.tsx`
- **Pagination** : Modifiez `TICKETS_PER_PAGE` dans `app/page.tsx`

---

## 🎉 Conclusion

**SmartQueue** est maintenant prêt à gérer vos files d'attente de manière professionnelle et efficace. L'architecture Service → Poste → Staff garantit une séparation claire des responsabilités et une scalabilité optimale.

Pour toute question ou amélioration, n'hésitez pas à consulter la documentation technique dans `ARCHITECTURE_SERVICE_POSTE_STAFF.md`.

**Bon déploiement ! 🚀**
