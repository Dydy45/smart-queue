# SmartQueue - Documentation Technique

> Document de reference pour l'equipe du projet tutore.
> Derniere mise a jour : Mars 2026

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Base de donnees](#4-base-de-donnees)
5. [Architecture applicative](#5-architecture-applicative)
6. [Composants React](#6-composants-react)
7. [Server Actions (API)](#7-server-actions-api)
8. [Librairies utilitaires](#8-librairies-utilitaires)
9. [Securite](#9-securite)
10. [Temps reel (WebSocket)](#10-temps-reel-websocket)
11. [Flux de donnees](#11-flux-de-donnees)
12. [Installation et configuration](#12-installation-et-configuration)
13. [Deploiement](#13-deploiement)

---

## 1. Vue d'ensemble

**SmartQueue** est une application web de gestion de files d'attente multi-services. Elle permet a une entreprise de :

- Creer des **services** (ex: "Consultation", "Radiologie")
- Creer des **postes de travail** lies a un service (ex: "Cabinet Dr. Martin")
- Gerer des **employes** (ADMIN/STAFF) et leur assigner des postes
- Permettre aux **clients** de prendre un ticket via une page publique
- **Traiter les tickets** en temps reel (appeler, traiter, terminer)
- Offrir des fonctionnalites avancees : **rendez-vous**, **file virtuelle**, **notifications WhatsApp**, **estimation du temps d'attente par ML**

### Roles utilisateur

| Role | Description | Acces |
|------|-------------|-------|
| **OWNER** | Proprietaire de l'entreprise | Tout (services, postes, staff, dashboard, settings) |
| **ADMIN** | Administrateur | Services, postes, dashboard (pas de gestion du staff) |
| **STAFF** | Employe | Uniquement les postes qui lui sont assignes |

---

## 2. Stack technique

### Frontend
| Technologie | Version | Role |
|-------------|---------|------|
| **Next.js** | 16.1.6 | Framework React (App Router, SSR, Server Actions) |
| **React** | 19.2.3 | Bibliotheque UI |
| **TailwindCSS** | 4 | Framework CSS utilitaire |
| **DaisyUI** | 5.5.14 | Composants UI pre-styles (boutons, modals, etc.) |
| **Lucide React** | 0.563.0 | Icones SVG |
| **TypeScript** | 5 | Typage statique |

### Backend
| Technologie | Version | Role |
|-------------|---------|------|
| **Next.js Server Actions** | - | API serverless (fonctions `"use server"`) |
| **Prisma ORM** | 6.19.2 | Acces base de donnees (requetes typees) |
| **PostgreSQL** | - | Base de donnees relationnelle |
| **Zod** | 4.3.6 | Validation des entrees utilisateur |

### Services externes
| Service | Role |
|---------|------|
| **Clerk** | Authentification (OAuth, email/password, sessions) |
| **Upstash Redis** | Rate limiting distribue |
| **Twilio** | Notifications WhatsApp |
| **Neon** | Base PostgreSQL cloud (production) |
| **Vercel** | Hebergement et deploiement |

### Temps reel
| Technologie | Role |
|-------------|------|
| **Socket.io** | WebSocket bidirectionnel (serveur standalone) |
| **HTTP Polling** | Fallback (toutes les 5s cote client) |

---

## 3. Structure du projet

```
smart-queue/
|
|-- app/                          # Dossier principal Next.js (App Router)
|   |-- layout.tsx                # Layout racine (ClerkProvider, meta, fonts)
|   |-- page.tsx                  # Page d'accueil "/" (landing ou redirect)
|   |-- actions.ts                # Server Actions principaux (47 Ko, ~1400 lignes)
|   |-- type.ts                   # Types TypeScript partages
|   |-- globals.css               # Styles globaux (Tailwind)
|   |
|   |-- actions/                  # Server Actions secondaires (modules separes)
|   |   |-- appointments.ts       # Gestion des rendez-vous
|   |   |-- business-hours.ts     # Horaires d'ouverture
|   |   |-- estimation.ts         # Estimation temps d'attente (ML)
|   |   |-- feedback.ts           # Feedback clients
|   |   |-- theme.ts              # Theme/branding entreprise
|   |   |-- tracking.ts           # Suivi GPS tickets virtuels
|   |   |-- virtual-queue.ts      # File d'attente virtuelle
|   |   |-- whatsapp.ts           # Notifications WhatsApp
|   |
|   |-- components/               # Composants React reutilisables
|   |   |-- Wrapper.tsx           # Conteneur principal (sidebar + navbar + session)
|   |   |-- Sidebar.tsx           # Navigation laterale (filtree par role)
|   |   |-- Navbar.tsx            # Barre de navigation superieure
|   |   |-- TicketComponent.tsx   # Affichage d'un ticket
|   |   |-- SettingsModal.tsx     # Modal de configuration (pageName)
|   |   |-- DisplayBoard.tsx      # Ecran d'affichage TV
|   |   |-- AppointmentCalendar.tsx # Calendrier de rendez-vous
|   |   |-- FeedbackModal.tsx     # Modal de feedback client
|   |   |-- CompanyThemeProvider.tsx # Fournisseur de theme entreprise
|   |   |-- EmptyState.tsx        # Composant etat vide
|   |   |-- InstallPWA.tsx        # Bouton installation PWA
|   |   |-- OfflineIndicator.tsx  # Indicateur mode hors ligne
|   |   |-- RegisterSW.tsx        # Enregistrement Service Worker
|   |   |-- UpdateNotification.tsx # Notification de mise a jour
|   |
|   |-- home/page.tsx             # Page d'accueil apres connexion (dashboard)
|   |-- services/page.tsx         # CRUD des services
|   |-- poste_list/page.tsx       # CRUD des postes
|   |-- staff/page.tsx            # Gestion du personnel
|   |-- dashboard/page.tsx        # Tableau de bord statistiques
|   |-- call/[idPoste]/page.tsx   # Interface d'appel de tickets
|   |-- poste/[idPoste]/page.tsx  # Details d'un poste
|   |-- page/[pageName]/page.tsx  # Page publique client (creation de tickets)
|   |-- display/[pageName]/...    # Ecran d'affichage TV
|   |-- landing/page.tsx          # Landing page marketing
|   |-- estimation/page.tsx       # Page d'estimation temps d'attente
|   |-- feedbacks/page.tsx        # Gestion des feedbacks
|   |-- appointment/...           # Page publique de prise de RDV
|   |-- appointments/page.tsx     # Gestion des RDV (admin)
|   |-- track/[trackingToken]/... # Suivi de ticket virtuel
|   |-- settings/                 # Pages de parametres
|   |   |-- business-hours/       # Configuration horaires
|   |   |-- theme/                # Configuration theme/branding
|   |   |-- virtual-queue/        # Configuration file virtuelle
|   |-- sign-in/page.tsx          # Page de connexion Clerk
|   |-- sign-up/page.tsx          # Page d'inscription Clerk
|   |-- offline/page.tsx          # Page hors ligne (PWA)
|
|-- lib/                          # Librairies utilitaires
|   |-- prisma.ts                 # Singleton Prisma Client
|   |-- auth.ts                   # Helpers authentification/autorisation
|   |-- validation.ts             # Schemas Zod (validation entrees)
|   |-- ratelimit.ts              # Rate limiting (Upstash + fallback memoire)
|   |-- ticket-utils.ts           # Generation numeros de ticket
|   |-- wait-time-estimator.ts    # Algorithme d'estimation (EWMA)
|   |-- geo-utils.ts              # Calculs geographiques (Haversine)
|   |-- whatsapp.ts               # Client Twilio WhatsApp
|   |-- socket.ts                 # Client Socket.io
|   |-- toast.ts / useToast.ts    # Systeme de notifications toast
|   |-- ToastProvider.tsx         # Fournisseur de contexte toast
|   |-- init.ts                   # Initialisation (rate limit cleanup)
|
|-- prisma/
|   |-- schema.prisma             # Schema de base de donnees
|   |-- migrations/               # 11 fichiers de migration SQL
|
|-- server.js                     # Serveur WebSocket standalone (Socket.io)
|-- proxy.ts                      # Middleware Clerk (protection des routes)
|-- prisma.config.ts              # Configuration Prisma
|-- next.config.ts                # Configuration Next.js (headers securite)
|-- package.json                  # Dependances et scripts
|-- env.example                   # Template des variables d'environnement
```

---

## 4. Base de donnees

### Schema relationnel (Prisma)

```
Company (Entreprise)
  |-- id            UUID (PK)
  |-- name          String
  |-- email         String (UNIQUE) ← identifiant du proprietaire
  |-- pageName      String? (UNIQUE) ← URL publique : /page/{pageName}
  |-- logoUrl, primaryColor, accentColor, description  ← branding
  |-- latitude, longitude           ← GPS (file virtuelle)
  |-- virtualQueueEnabled           ← Boolean
  |-- proximityRadius               ← Int (metres)
  |
  |--→ Service[] (1:N)
  |--→ Post[] (1:N)
  |--→ Staff[] (1:N)
  |--→ Feedback[] (1:N)
  |--→ Appointment[] (1:N)
  |--→ BusinessHours[] (1:N)
  |--→ ClosedDate[] (1:N)


Service
  |-- id            UUID (PK)
  |-- name          String          ← ex: "Consultation medicale"
  |-- avgTime       Int             ← temps moyen en minutes
  |-- companyId     FK → Company
  |
  |--→ Post[] (1:N)
  |--→ Ticket[] (1:N)
  |--→ Appointment[] (1:N)


Post (Poste de travail)
  |-- id            UUID (PK)
  |-- name          String          ← ex: "Cabinet Dr. Martin"
  |-- companyId     FK → Company
  |-- serviceId     FK → Service (CASCADE delete)
  |
  |--→ Ticket[] (1:N)
  |--→ Staff[] (N:N)               ← relation many-to-many implicite
  |--→ Appointment[] (1:N)


Ticket
  |-- id              UUID (PK)
  |-- num             String (UNIQUE) ← ex: "T20250301A"
  |-- nameComplete    String          ← nom du client
  |-- status          String          ← PENDING | CALL | IN_PROGRESS | FINISHED
  |-- priority        Enum            ← NORMAL | APPOINTMENT
  |-- serviceId       FK → Service
  |-- postId          FK? → Post      ← assigne quand CALL
  |-- postName        String?         ← copie du nom du poste
  |-- createdAt       DateTime
  |-- calledAt        DateTime?       ← quand status → CALL
  |-- startedAt       DateTime?       ← quand status → IN_PROGRESS
  |-- finishedAt      DateTime?       ← quand status → FINISHED
  |-- phoneNumber     String?         ← WhatsApp
  |-- whatsappConsent Boolean
  |-- isVirtual       Boolean         ← ticket file virtuelle
  |-- clientLat/Lng   Float?          ← GPS client
  |-- trackingToken   String? (UNIQUE) ← suivi virtuel
  |-- appointmentId   FK? → Appointment


Staff (Employe)
  |-- id            UUID (PK)
  |-- email         String
  |-- name          String
  |-- role          Enum            ← ADMIN | STAFF
  |-- companyId     FK → Company
  |
  |--→ Post[] (N:N)                ← assignedPosts
  |
  |-- @@unique([email, companyId]) ← un email par entreprise


Feedback
  |-- id          UUID (PK)
  |-- ticketId    FK → Ticket (UNIQUE, 1:1)
  |-- companyId   FK → Company
  |-- rating      Int (1-5)
  |-- comment     String?


Appointment (Rendez-vous)
  |-- id              UUID (PK)
  |-- companyId       FK → Company
  |-- serviceId       FK → Service
  |-- postId          FK? → Post
  |-- clientName      String
  |-- clientEmail     String?
  |-- clientPhone     String?
  |-- appointmentDate DateTime
  |-- duration        Int (minutes)
  |-- status          Enum ← PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
  |-- cancelToken     UUID (UNIQUE)
  |-- notes           String?
  |
  |--→ AppointmentReminder[] (1:N)
  |--→ Ticket[] (1:N)


BusinessHours (Horaires d'ouverture)
  |-- companyId   FK → Company
  |-- dayOfWeek   Int (0=Dimanche ... 6=Samedi)
  |-- openTime    String ("HH:mm")
  |-- closeTime   String ("HH:mm")
  |-- isOpen      Boolean
  |-- @@unique([companyId, dayOfWeek])


ClosedDate (Jours de fermeture)
  |-- companyId   FK → Company
  |-- date        Date
  |-- reason      String?
```

### Diagramme des relations

```
Company ──1:N──→ Service ──1:N──→ Ticket
    |                |                |
    |──1:N──→ Post ←─┘                |──1:1──→ Feedback
    |           |                     |──N:1──→ Appointment
    |──1:N──→ Staff ←──N:N──→ Post
    |
    |──1:N──→ Appointment ──1:N──→ AppointmentReminder
    |──1:N──→ BusinessHours
    |──1:N──→ ClosedDate
    |──1:N──→ Feedback
```

### Cycle de vie d'un ticket

```
             ┌─────────────┐
             │   PENDING    │  ← Client cree le ticket
             │  (postId=null)│
             └──────┬───────┘
                    │ Staff clique "Appeler"
                    ▼
             ┌─────────────┐
             │    CALL      │  ← postId assigne, calledAt = now
             │ (postId=xxx) │
             └──────┬───────┘
                    │ Staff clique "Commencer"
                    ▼
             ┌─────────────┐
             │ IN_PROGRESS  │  ← startedAt = now
             └──────┬───────┘
                    │ Staff clique "Terminer"
                    ▼
             ┌─────────────┐
             │  FINISHED    │  ← finishedAt = now
             └─────────────┘
```

---

## 5. Architecture applicative

### Modele Client-Serveur

```
┌──────────────────────────────────────────────────────┐
│                    NAVIGATEUR                         │
│                                                      │
│  ┌────────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ React      │  │ Clerk    │  │ Socket.io Client │ │
│  │ Components │  │ Provider │  │  (temps reel)    │ │
│  └─────┬──────┘  └────┬─────┘  └────────┬─────────┘ │
└────────┼──────────────┼─────────────────┼────────────┘
         │              │                 │
    Server Actions   Auth JWT        WebSocket
         │              │                 │
┌────────┼──────────────┼─────────────────┼────────────┐
│        ▼              ▼                 ▼            │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Next.js  │  │ Clerk    │  │ server.js         │  │
│  │ Server   │  │ Webhook  │  │ (WebSocket Server)│  │
│  │ Actions  │  │          │  │  Port 3001        │  │
│  └─────┬────┘  └──────────┘  └────────┬──────────┘  │
│        │                              │              │
│        ▼                              ▼              │
│  ┌──────────────────────────────────────────────┐    │
│  │           Prisma ORM (lib/prisma.ts)         │    │
│  └──────────────────────┬───────────────────────┘    │
│                         │                            │
│                         ▼                            │
│              ┌──────────────────┐                    │
│              │   PostgreSQL     │                    │
│              │  (Neon en prod)  │                    │
│              └──────────────────┘                    │
│                                                      │
│                      SERVEUR                         │
└──────────────────────────────────────────────────────┘
```

### Middleware d'authentification (`proxy.ts`)

Le middleware Clerk intercepte **toutes les requetes** et protege les routes privees :

```
Routes publiques (pas d'auth requise) :
  /              ← landing
  /sign-in(.*)   ← connexion
  /sign-up(.*)   ← inscription
  /page(.*)      ← page client publique
  /landing       ← landing page
  /offline       ← page hors ligne
  /display(.*)   ← ecran d'affichage TV
  /appointment(..) ← prise de RDV
  /track(..)     ← suivi ticket virtuel

Routes privees (auth obligatoire) :
  /home, /services, /poste_list, /staff,
  /dashboard, /call/*, /settings/*, etc.
```

---

## 6. Composants React

### Composants structurels

| Composant | Fichier | Description |
|-----------|---------|-------------|
| **Wrapper** | `components/Wrapper.tsx` | Conteneur principal. Charge la session utilisateur via `initUserSession()`, gere le `userRole` et le `pageName`. Englobe Sidebar + Navbar + contenu. |
| **Sidebar** | `components/Sidebar.tsx` | Navigation laterale. Les liens sont **filtres par role** : un STAFF ne voit que "Accueil", un OWNER voit tout. Responsive (mode mobile). |
| **Navbar** | `components/Navbar.tsx` | Barre superieure. Affiche l'email, le bouton theme, le bouton menu mobile, et le `SettingsModal`. |

### Composants fonctionnels

| Composant | Description |
|-----------|-------------|
| **TicketComponent** | Affiche un ticket avec son numero, nom client, service, statut, temps ecoule. Boutons d'action (appeler, commencer, terminer, annuler). |
| **SettingsModal** | Modal pour configurer le `pageName` de l'entreprise (URL publique). Non modifiable une fois defini. |
| **DisplayBoard** | Ecran d'affichage type "TV salle d'attente". Affiche les tickets appeles, en cours, et en attente. Rafraichissement auto. |
| **AppointmentCalendar** | Calendrier interactif pour la prise de rendez-vous. Affiche les creneaux disponibles par service. |
| **FeedbackModal** | Modal de feedback client (note 1-5 + commentaire). Affiche apres la fin du traitement d'un ticket. |
| **CompanyThemeProvider** | Injecte les couleurs personnalisees de l'entreprise (logo, couleur primaire/accent). |
| **EmptyState** | Composant d'etat vide (aucun service, aucun poste, etc.). |
| **InstallPWA** | Bouton pour installer l'app en PWA sur mobile. |

### Flux de rendu (Wrapper)

```
1. Wrapper monte → useUser() (Clerk) charge l'utilisateur
2. useEffect detecte `email` → appelle initUserSession(email, fullName)
3. initUserSession retourne { role, pageName }
4. setUserRole(role) → Sidebar affiche les liens correspondants
5. setPageName(pageName) → Sidebar affiche "Page publique"
6. children (page actuelle) est rendu dans <main>
```

---

## 7. Server Actions (API)

Les Server Actions sont des fonctions `"use server"` appelees directement depuis les composants React. Pas de routes API manuelles.

### Fichier principal : `app/actions.ts`

| Fonction | Role | Acces |
|----------|------|-------|
| `initUserSession(email, name)` | Identifie le role (OWNER/ADMIN/STAFF) et le pageName | Public |
| `checkAndAddUser(email, name)` | Cree l'entreprise si nouvel utilisateur | Public |
| `createService(email, name, avgTime)` | Cree un service | OWNER |
| `getServiceByEmail(email)` | Liste les services de l'entreprise | OWNER/ADMIN/STAFF |
| `deleteServiceById(serviceId)` | Supprime un service et ses tickets (CASCADE) | OWNER |
| `setCompanyPageName(email, pageName)` | Definit l'URL publique | OWNER |
| `getServicesByPageName(pageName)` | Liste les services (page publique) | Public |
| `createTicket(serviceId, name, pageName, ...)` | Cree un ticket | Public |
| `getPendingTicketsByEmail(email)` | Tickets actifs (filtres par role STAFF) | OWNER/ADMIN/STAFF |
| `getTicketsForDisplay(pageName)` | Tickets pour l'ecran TV | Public |
| `getTicketsWithContext(ticketNums, pageName)` | Tickets du client + contexte file | Public |
| `createPost(email, name, serviceId)` | Cree un poste lie a un service | OWNER |
| `deletePost(postId)` | Supprime un poste | OWNER |
| `getLastTicketByEmail(email, idPoste)` | Appelle le prochain ticket (FIFO + priorite RDV) | OWNER/ADMIN/STAFF |
| `updateTicketStatus(ticketId, status)` | Change le statut d'un ticket | OWNER/ADMIN/STAFF |
| `addStaff(email, staffEmail, name, role)` | Ajoute un employe | OWNER |
| `getStaffByCompany(email)` | Liste les employes | OWNER |
| `updateStaffRole(email, staffId, role)` | Change le role d'un employe | OWNER |
| `removeStaff(email, staffId)` | Supprime un employe | OWNER |
| `assignPostToStaff(email, staffId, postId)` | Assigne un poste a un employe | OWNER |
| `unassignPostFromStaff(email, staffId, postId)` | Retire un poste d'un employe | OWNER |
| `getMyAssignedPosts()` | Postes assignes au staff connecte | STAFF |
| `getAssignedPosts(email, staffId)` | Postes assignes a un employe | OWNER |
| `getTicketStatsByEmail(email)` | Statistiques (total, finis, en attente) | OWNER |
| `get10LstFinishedTicketsByEmail(email)` | 10 derniers tickets termines | OWNER |

### Fichiers secondaires (`app/actions/`)

| Fichier | Fonctions principales |
|---------|-----------------------|
| `appointments.ts` | `createAppointment`, `getAppointments`, `updateAppointmentStatus`, `cancelAppointment`, `convertAppointmentToTicket` |
| `business-hours.ts` | `getBusinessHours`, `updateBusinessHours`, `getClosedDates`, `addClosedDate`, `removeClosedDate` |
| `estimation.ts` | `getPublicWaitTimeEstimation`, `getEstimationDashboard` |
| `feedback.ts` | `submitFeedback`, `getFeedbackStats` |
| `theme.ts` | `updateCompanyTheme`, `getCompanyTheme` |
| `tracking.ts` | `updateClientLocation`, `getTrackingInfo` |
| `virtual-queue.ts` | `updateCompanyLocation`, `toggleVirtualQueue`, `updateProximityRadius`, `checkDepartureNotifications`, `cleanupGeoData` |
| `whatsapp.ts` | `checkAndNotifyUpcomingTickets`, `notifyTicketCalled` |

### Pattern commun de chaque action

```typescript
export async function maFonction(params) {
    // 1. Rate limiting (Upstash Redis)
    const { success } = await checkRateLimit(key, limit, windowMs)
    if (!success) throw new RateLimitError(...)

    // 2. Authentification / Autorisation
    await verifyCompanyOwnership(email)  // ou verifyStaffAccess()

    // 3. Validation des entrees (Zod)
    const validated = schema.parse(input)

    // 4. Logique metier (Prisma)
    const result = await prisma.model.create/update/delete(...)

    // 5. Actions asynchrones non-bloquantes (WhatsApp, virtual queue)
    notifyTicketCalled(id).catch(console.error)

    return result
}
```

---

## 8. Librairies utilitaires

### `lib/prisma.ts` - Client base de donnees

Singleton PrismaClient pour eviter les connexions multiples en dev (hot reload). En production, une seule instance est creee.

### `lib/auth.ts` - Authentification

| Fonction | Description |
|----------|-------------|
| `getCurrentUserEmail()` | Retourne l'email de l'utilisateur connecte via Clerk |
| `verifyCompanyOwnership(email)` | Verifie que l'utilisateur connecte est bien le proprietaire |
| `requireAuth()` | Verifie qu'un utilisateur est connecte |
| `verifyStaffAccess()` | Retourne `{ role, companyId, staffId? }` — fonctionne pour OWNER, ADMIN et STAFF |

### `lib/validation.ts` - Validation Zod

26 schemas de validation couvrant toutes les entrees utilisateur :

| Schema | Regles |
|--------|--------|
| `emailSchema` | Email valide, lowercase |
| `serviceNameSchema` | 1-50 chars, trim |
| `pageNameSchema` | 3-30 chars, alphanumerique + tirets, lowercase |
| `customerNameSchema` | 1-100 chars, trim |
| `postNameSchema` | 1-50 chars, trim |
| `avgTimeSchema` | Entier 1-1440 (max 24h) |
| `ticketStatusSchema` | Enum: PENDING, CALL, IN_PROGRESS, FINISHED |
| `feedbackSchema` | rating 1-5, comment max 500 chars |
| `appointmentSchema` | serviceId, clientName, date, duration 5-480min |
| `businessHoursSchema` | dayOfWeek 0-6, format HH:mm |
| `themeSchema` | logoUrl, primaryColor (#RRGGBB), description |

### `lib/ratelimit.ts` - Protection anti-abus

Dual-mode :
- **Production** : Upstash Redis (distribue, survit aux redemarrages)
- **Dev local** : Fallback en memoire (Map JavaScript)

Configurations predefinies :
- Creation ticket : **10/min** par page
- Creation service/poste : **5/min** par email
- Mise a jour ticket : **20/min** par ticket
- Ajout staff : **10/min** par email

### `lib/wait-time-estimator.ts` - Estimation ML

Algorithme d'estimation du temps d'attente base sur **EWMA (Exponentially Weighted Moving Average)** :

```
Niveaux de confiance :
  none    → 0 ticket historique  → utilise avgTime configure
  low     → 1-9 tickets         → moyenne simple
  medium  → 10-49 tickets       → EWMA sans contexte horaire
  high    → 50+ tickets         → EWMA complet avec heure/jour de la semaine
```

Formule : `tempsAttente = (dureeEstimee / nbPostesActifs) * positionDansFile`

### `lib/geo-utils.ts` - Calculs geographiques

- `calculateDistance(lat1, lng1, lat2, lng2)` : Distance Haversine en metres
- `estimateTravelTime(distance, mode)` : Estimation trajet (5 km/h a pied, 30 km/h en voiture)
- `isValidCoordinates(lat, lng)` : Validation GPS
- `formatDistance(meters)` : Formatage lisible ("450 m", "2.3 km")

### `lib/ticket-utils.ts` - Generation de numeros

Format : `T` + timestamp base 36 + 4 bytes aleatoires (crypto). Exemple : `T20250301A4`.

### `lib/whatsapp.ts` - Client Twilio

Envoie des messages WhatsApp via l'API Twilio :
- Notification quand le ticket est appele
- Notification X positions avant l'appel (configurable)
- Validation des numeros de telephone (libphonenumber-js)

---

## 9. Securite

### Couches de securite

```
Requete client
    │
    ▼
[1] Middleware Clerk (proxy.ts)      ← Authentification JWT
    │
    ▼
[2] Rate Limiting (ratelimit.ts)     ← Anti-DDoS/abus
    │
    ▼
[3] Autorisation (auth.ts)           ← Verification role/propriete
    │
    ▼
[4] Validation Zod (validation.ts)   ← Sanitisation entrees
    │
    ▼
[5] Prisma ORM                       ← Requetes parametrees (anti-SQLi)
    │
    ▼
[6] PostgreSQL                       ← Contraintes d'integrite (FK, UNIQUE)
```

### Headers HTTP de securite (`next.config.ts`)

| Header | Valeur | Protection |
|--------|--------|------------|
| `X-Content-Type-Options` | `nosniff` | Empeche le sniffing MIME |
| `X-Frame-Options` | `DENY` | Bloque l'integration en iframe (anti-clickjacking) |
| `X-XSS-Protection` | `1; mode=block` | Protection XSS navigateur |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controle les infos de referrer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` | Restreint les API sensibles |

### Bonnes pratiques appliquees

- Secrets dans les variables d'environnement (jamais en dur)
- Validation cote serveur de **toutes** les entrees (Zod)
- Verification d'autorisation dans **chaque** Server Action
- Rate limiting par action et par utilisateur
- `onDelete: Cascade` sur les relations critiques (suppression en cascade)
- Nettoyage RGPD des donnees GPS quand un ticket est termine
- Tokens d'annulation uniques pour les rendez-vous

---

## 10. Temps reel (WebSocket)

### Serveur WebSocket (`server.js`)

Serveur standalone sur le **port 3001** (separe de Next.js). Il poll la base de donnees toutes les **2 secondes** et envoie les mises a jour uniquement si les donnees ont change.

### Fonctionnement

```
server.js (port 3001)
    │
    ├── Connexion admin (socket.on('login', email))
    │   └── Stocke email → socketId dans userConnections
    │
    ├── Connexion client (socket.on('joinPage', { pageName, ticketNums }))
    │   └── Stocke pageName → socketId → ticketNums dans publicConnections
    │
    └── setInterval(2000ms)
        ├── Fetch tous les tickets actifs (PENDING, CALL, IN_PROGRESS)
        ├── Compare avec le dernier etat (hash JSON)
        ├── Si change → envoie 'ticketsUpdated' aux admins
        └── Si change → envoie 'publicTicketsUpdated' aux clients
```

### Evenements Socket.io

| Evenement | Direction | Description |
|-----------|-----------|-------------|
| `login` | Client → Serveur | Admin se connecte avec son email |
| `joinPage` | Client → Serveur | Client rejoint une page publique |
| `updateTicketNums` | Client → Serveur | Client met a jour ses numeros de tickets |
| `ticketsUpdated` | Serveur → Client | Nouveaux tickets pour l'admin |
| `publicTicketsUpdated` | Serveur → Client | Nouveaux tickets pour le client |

---

## 11. Flux de donnees

### Flux 1 : Inscription et configuration (OWNER)

```
1. Utilisateur s'inscrit via Clerk (/sign-up)
2. Redirect vers /home
3. Wrapper.tsx appelle initUserSession(email, fullName)
4. initUserSession() :
   a. Cherche Company avec cet email → pas trouve
   b. Cherche Staff avec cet email → pas trouve
   c. Cree une Company { email, name }
   d. Retourne { role: 'OWNER', pageName: null }
5. OWNER configure ses services (/services) → createService()
6. OWNER configure ses postes (/poste_list) → createPost()
7. OWNER ajoute des employes (/staff) → addStaff()
8. OWNER assigne des postes aux employes → assignPostToStaff()
9. OWNER definit le pageName (SettingsModal) → setCompanyPageName()
```

### Flux 2 : Creation d'un ticket (Client)

```
1. Client accede a /page/{pageName}
2. getServicesByPageName() retourne la liste des services
3. Client choisit un service, entre son nom
4. createTicket() :
   a. Rate limit check (10/min par page)
   b. Validation Zod (nom, pageName)
   c. Genere un numero unique (T20250301A4)
   d. Cree le ticket en DB (status: PENDING)
   e. Si virtuel : genere un trackingToken
5. Client recoit son numero de ticket
6. Polling HTTP (5s) ou WebSocket pour les mises a jour
```

### Flux 3 : Traitement d'un ticket (STAFF)

```
1. Staff se connecte → voit ses postes assignes (/home)
2. Staff clique sur un poste → /call/{idPoste}
3. Staff clique "Appeler le prochain"
4. getLastTicketByEmail() :
   a. Verifie l'acces staff au poste
   b. Cherche un ticket existant (CALL/IN_PROGRESS) pour ce poste
   c. Sinon : cherche le premier PENDING (priorite APPOINTMENT > NORMAL)
   d. Met a jour : status=CALL, postId=idPoste, calledAt=now()
   e. Envoie notification WhatsApp (non-bloquant)
5. Staff clique "Commencer" → status=IN_PROGRESS, startedAt=now()
6. Staff clique "Terminer" → status=FINISHED, finishedAt=now()
   a. Nettoyage RGPD des donnees GPS
   b. Notification prochains clients
```

---

## 12. Installation et configuration

### Prerequis

- **Node.js 20+**
- **PostgreSQL** (local pour le dev, Neon/Supabase pour la prod)
- **Compte Clerk** (gratuit) : [clerk.com](https://clerk.com)
- **Compte Upstash** (optionnel, gratuit) : [upstash.com](https://upstash.com)

### Etapes

```bash
# 1. Cloner le projet
git clone https://github.com/Dydy45/smart-queue.git
cd smart-queue

# 2. Installer les dependances
npm install

# 3. Creer le fichier .env (copier env.example et remplir les valeurs)
# Les variables obligatoires sont :
#   DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

# 4. Creer la base de donnees locale
# (PostgreSQL doit tourner sur localhost:5432)
# Creer la DB : CREATE DATABASE smartqueue;

# 5. Appliquer les migrations
npx prisma migrate deploy
npx prisma generate

# 6. Lancer le serveur de dev
npm run dev

# 7. (Optionnel) Lancer le serveur WebSocket
npm run socket-server
```

### Variables d'environnement requises

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DATABASE_URL` | Oui | URL PostgreSQL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Oui | Cle publique Clerk |
| `CLERK_SECRET_KEY` | Oui | Cle secrete Clerk |
| `UPSTASH_REDIS_REST_URL` | Non | URL Upstash (rate limiting distribue) |
| `UPSTASH_REDIS_REST_TOKEN` | Non | Token Upstash |
| `TWILIO_ACCOUNT_SID` | Non | SID Twilio (WhatsApp) |
| `TWILIO_AUTH_TOKEN` | Non | Token Twilio |
| `TWILIO_WHATSAPP_NUMBER` | Non | Numero WhatsApp Twilio |
| `NEXT_PUBLIC_SOCKET_URL` | Non | URL du serveur WebSocket |

---

## 13. Deploiement

### Production (Vercel + Neon)

```
GitHub (main) ──push──→ Vercel (auto-deploy)
                              │
                              ▼
                        Build: prisma generate && next build
                              │
                              ▼
                        Runtime: Next.js serverless
                              │
                              ▼
                        Neon PostgreSQL (cloud)
```

### Variables Vercel

Toutes les variables du `.env` doivent etre definies dans **Vercel → Settings → Environment Variables** avec la `DATABASE_URL` pointant vers Neon (pas localhost).

### Commandes utiles

```bash
npm run dev              # Serveur de dev Next.js (port 3000)
npm run build            # Build de production
npm run start            # Lancer en production
npm run socket-server    # Serveur WebSocket (port 3001)
npm run lint             # ESLint
npx prisma studio        # Interface graphique de la DB
npx prisma migrate dev   # Creer une nouvelle migration
npx prisma migrate deploy # Appliquer les migrations
npx prisma generate      # Regenerer le client Prisma
```

---

## Annexe : Scripts npm

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `next dev` | Serveur de developpement |
| `build` | `prisma generate && next build` | Build de production |
| `start` | `next start` | Serveur de production |
| `lint` | `eslint` | Verification du code |
| `socket-server` | `tsx server.js` | Serveur WebSocket temps reel |
| `video:preview` | `remotion studio ...` | Preview video marketing |
| `video:render` | `remotion render ...` | Rendu video marketing |
