# 📋 Analyse Fonctionnelle Complète — SmartQueue

**Version** : 1.2  
**Date** : 18 mars 2026  
**Dernière mise à jour** : 22 mars 2026

---

## 📖 Table des matières

1. [Présentation générale](#1--présentation-générale)
2. [Architecture technique](#2--architecture-technique)
3. [Modèle de données](#3--modèle-de-données)
4. [Rôles et permissions](#4--rôles-et-permissions)
5. [Parcours Client (visiteur non authentifié)](#5--parcours-client-visiteur-non-authentifié)
6. [Parcours Staff (employé)](#6--parcours-staff-employé)
7. [Parcours Admin](#7--parcours-admin)
8. [Parcours Owner (propriétaire)](#8--parcours-owner-propriétaire)
9. [Système de tickets — Flux complet](#9--système-de-tickets--flux-complet)
10. [Système de rendez-vous — Flux complet](#10--système-de-rendez-vous--flux-complet)
11. [Système hybride Tickets/RDV — Coexistence](#11--système-hybride-ticketsrdv--coexistence)
12. [Estimation Intelligente (ML)](#12--estimation-intelligente-ml)
13. [Système de feedback](#13--système-de-feedback)
14. [Notifications WhatsApp](#14--notifications-whatsapp)
15. [Affichage public TV](#15--affichage-public-tv)
16. [Thème personnalisable](#16--thème-personnalisable)
17. [Sécurité](#17--sécurité)
18. [Routes et middleware](#18--routes-et-middleware)
19. [Arborescence des pages](#19--arborescence-des-pages)
20. [Diagrammes de flux](#20--diagrammes-de-flux)

---

## 1 — Présentation générale

**SmartQueue** est une application web de gestion de file d'attente et de prise de rendez-vous en ligne. Elle permet à une entreprise (salon, cabinet médical, administration, etc.) de :

- Gérer une **file d'attente numérique** en temps réel
- Proposer la **prise de rendez-vous en ligne** à ses clients
- Afficher la file d'attente sur un **écran TV** en salle d'attente
- Recevoir des **feedbacks clients** après chaque service
- Envoyer des **notifications WhatsApp** pour prévenir les clients de leur tour
- **Personnaliser l'apparence** de ses pages publiques (logo, couleurs, description)

L'application est une **PWA** (Progressive Web App) installable sur mobile, fonctionnant même hors-ligne pour les fonctionnalités de base.

---

## 2 — Architecture technique

| Couche | Technologie |
|--------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Langage** | TypeScript (strict) |
| **Base de données** | PostgreSQL |
| **ORM** | Prisma 7.3 |
| **Authentification** | Clerk (OAuth, email/password) |
| **UI** | TailwindCSS + DaisyUI 5 |
| **Icônes** | Lucide React |
| **Validation** | Zod |
| **PWA** | Service Worker + manifest |
| **Notifications** | WhatsApp Business API (Twilio) |

### Structure des fichiers clés

```
smart-queue/
├── app/
│   ├── actions.ts              # Server Actions principales (tickets, services, postes, staff)
│   ├── actions/
│   │   ├── appointments.ts     # Server Actions rendez-vous
│   │   ├── business-hours.ts   # Server Actions horaires d'ouverture
│   │   ├── feedback.ts         # Server Actions feedbacks
│   │   ├── theme.ts            # Server Actions thème personnalisable
│   │   └── whatsapp.ts         # Server Actions notifications WhatsApp
│   ├── components/             # Composants React réutilisables
│   ├── page/[pageName]/        # Page publique de prise de ticket
│   ├── appointment/[pageName]/ # Page publique de prise de RDV
│   ├── appointment/cancel/     # Page publique d'annulation de RDV
│   ├── display/[pageName]/     # Affichage public TV
│   ├── home/                   # Tableau de bord (authentifié)
│   ├── services/               # Gestion des services (OWNER/ADMIN)
│   ├── poste_list/             # Gestion des postes (OWNER/ADMIN)
│   ├── poste/[idPoste]/        # Vue poste — file d'attente
│   ├── call/[idPoste]/         # Vue poste — traitement du ticket en cours
│   ├── staff/                  # Gestion des employés (OWNER)
│   ├── dashboard/              # Statistiques tickets (OWNER/ADMIN)
│   ├── feedbacks/              # Statistiques feedbacks (OWNER/ADMIN)
│   ├── appointments/           # Dashboard rendez-vous (OWNER/ADMIN)
│   ├── settings/
│   │   ├── business-hours/     # Configuration horaires (OWNER/ADMIN)
│   │   └── theme/              # Personnalisation visuelle (OWNER/ADMIN)
│   ├── landing/                # Landing page marketing
│   └── layout.tsx              # Layout global (Clerk, Navbar, PWA)
├── lib/
│   ├── auth.ts                 # Fonctions d'authentification et d'autorisation
│   ├── prisma.ts               # Client Prisma (singleton)
│   ├── validation.ts           # Schémas Zod
│   ├── ratelimit.ts            # Rate limiting en mémoire
│   ├── whatsapp.ts             # Client WhatsApp (Twilio)
│   └── ToastProvider.tsx       # Système de notifications toast
├── prisma/
│   └── schema.prisma           # Schéma de données
└── proxy.ts                    # Middleware Clerk (routes publiques/protégées)
```

---

## 3 — Modèle de données

### Entités principales

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Company    │──────<│   Service    │──────<│    Post      │
│              │       │              │       │              │
│ id           │       │ id           │       │ id           │
│ name         │       │ name         │       │ name         │
│ email (OWNER)│       │ avgTime      │       │ companyId    │
│ pageName     │       │ companyId    │       │ serviceId    │
│ logoUrl      │       └──────────────┘       └──────────────┘
│ primaryColor │              │                      │
│ accentColor  │              │                      │
│ description  │              ▼                      ▼
└──────────────┘       ┌──────────────┐       ┌──────────────┐
       │               │   Ticket     │       │    Staff     │
       │               │              │       │              │
       │               │ id           │       │ id           │
       │               │ num (unique) │       │ email        │
       │               │ nameComplete │       │ name         │
       │               │ status       │       │ role (ADMIN/ │
       │               │ serviceId    │       │       STAFF) │
       │               │ postId       │       │ companyId    │
       │               │ phoneNumber  │       │ assignedPosts│
       │               │ whatsappCons.│       └──────────────┘
       │               └──────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│ Appointment  │       │  Feedback    │
│              │       │              │
│ id           │       │ id           │
│ companyId    │       │ ticketId     │
│ serviceId    │       │ companyId    │
│ clientName   │       │ rating (1-5) │
│ clientEmail  │       │ comment      │
│ clientPhone  │       └──────────────┘
│ appointmentDate│
│ duration     │
│ status       │
│ cancelToken  │
└──────────────┘
       │
       ▼
┌──────────────────────┐
│ AppointmentReminder  │
│                      │
│ id                   │
│ appointmentId        │
│ reminderType (EMAIL/ │
│   SMS/WHATSAPP)      │
│ scheduledFor         │
│ status               │
└──────────────────────┘

┌──────────────┐       ┌──────────────┐
│BusinessHours │       │ ClosedDate   │
│              │       │              │
│ companyId    │       │ companyId    │
│ dayOfWeek    │       │ date         │
│ openTime     │       │ reason       │
│ closeTime    │       └──────────────┘
│ isOpen       │
└──────────────┘
```

### Statuts des tickets

| Statut | Description |
|--------|-------------|
| `PENDING` | Ticket créé, en attente dans la file |
| `CALL` | Le client est appelé au poste |
| `IN_PROGRESS` | Le service est en cours de traitement |
| `FINISHED` | Le service est terminé |

### Statuts des rendez-vous

| Statut | Description |
|--------|-------------|
| `PENDING` | Rendez-vous créé, en attente de confirmation |
| `CONFIRMED` | Rendez-vous confirmé par l'entreprise |
| `CANCELLED` | Rendez-vous annulé (par le client ou l'entreprise) |
| `COMPLETED` | Rendez-vous honoré et terminé |
| `NO_SHOW` | Le client ne s'est pas présenté |

---

## 4 — Rôles et permissions

### Détermination du rôle

Lors de la connexion via Clerk, la fonction `initUserSession(email, name)` détermine le rôle :

1. **L'email correspond à une `Company.email`** → rôle **OWNER**
2. **L'email correspond à un `Staff.email`** → rôle **ADMIN** ou **STAFF** (selon `Staff.role`)
3. **Aucune correspondance** → une nouvelle `Company` est créée automatiquement → **OWNER**

### Matrice des permissions

| Fonctionnalité | Client (non authentifié) | STAFF | ADMIN | OWNER |
|---------------|:---:|:---:|:---:|:---:|
| Voir la landing page | ✅ | ✅ | ✅ | ✅ |
| Prendre un ticket (`/page/[pageName]`) | ✅ | — | — | — |
| Prendre un RDV (`/appointment/[pageName]`) | ✅ | — | — | — |
| Annuler un RDV (`/appointment/cancel/[token]`) | ✅ | — | — | — |
| Voir l'affichage TV (`/display/[pageName]`) | ✅ | ✅ | ✅ | ✅ |
| Donner un feedback après service | ✅ | — | — | — |
| Voir le tableau de bord (`/home`) | — | ✅ | ✅ | ✅ |
| Voir ses postes assignés | — | ✅ | — | — |
| Appeler/traiter un ticket (`/call/[idPoste]`) | — | ✅ | ✅ | ✅ |
| Gérer les services | — | — | ✅ | ✅ |
| Gérer les postes | — | — | ✅ | ✅ |
| Voir les statistiques (`/dashboard`) | — | — | ✅ | ✅ |
| Voir les feedbacks (`/feedbacks`) | — | — | ✅ | ✅ |
| Gérer les rendez-vous (`/appointments`) | — | — | ✅ | ✅ |
| Configurer les horaires (`/settings/business-hours`) | — | — | ✅ | ✅ |
| Personnaliser le thème (`/settings/theme`) | — | — | ✅ | ✅ |
| Gérer les employés (`/staff`) | — | — | — | ✅ |
| Définir le pageName (Paramètres) | — | — | — | ✅ |

---

## 5 — Parcours Client (visiteur non authentifié)

Le client est un visiteur qui **n'a pas besoin de créer de compte**. Il interagit avec les pages publiques de l'entreprise.

### 5.1 — Prendre un ticket

**URL** : `/page/{pageName}` (ex: `/page/iss_kin`)

**Étapes** :
1. Le client accède à la page publique de l'entreprise via l'URL ou un QR code
2. Les services disponibles sont chargés (`getServicesByPageName`)
3. Le client :
   - Sélectionne un **service** dans la liste déroulante
   - Saisit son **nom complet** (obligatoire, min 2 caractères)
   - Optionnel : entre son **numéro de téléphone** et coche le **consentement WhatsApp**
4. Le client clique sur "Créer un ticket"
5. Le système :
   - Valide les données (Zod)
   - Vérifie le rate limiting (10 tickets/min par page)
   - Génère un numéro unique (format `T[timestamp][random]`, ex: `T20250301A`)
   - Crée le ticket en base avec le statut `PENDING`
6. Le ticket s'affiche en temps réel dans la liste du client
7. Le client peut voir :
   - Le **numéro** de son ticket
   - Le **service** choisi
   - Son **statut** actuel (PENDING → CALL → IN_PROGRESS → FINISHED)
   - Sa **position** estimée dans la file
   - Le **temps d'attente** estimé
8. La page se rafraîchit automatiquement **toutes les 5 secondes** (polling)
9. Les numéros de tickets sont stockés dans le **localStorage** du navigateur pour persister entre les sessions

### 5.2 — Suivi du ticket en temps réel

Le client peut suivre l'évolution de ses tickets :
- **PENDING** → "En attente" (badge gris)
- **CALL** → "Appelé" (badge orange) → le client doit se rendre au poste indiqué
- **IN_PROGRESS** → "En cours" (badge vert)
- **FINISHED** → "Terminé" (badge bleu) → un modal de feedback apparaît

### 5.3 — Donner un feedback

Quand un ticket passe en `FINISHED`, une modal s'affiche automatiquement :
- **Note** : 1 à 5 étoiles (obligatoire)
- **Commentaire** : texte libre (optionnel, max 500 caractères)
- Validation Zod côté serveur
- Un seul feedback par ticket (contrainte `@unique` sur `ticketId`)

### 5.4 — Prendre un rendez-vous

**URL** : `/appointment/{pageName}`

**Étapes (wizard 3 étapes)** :

**Étape 1 — Choix du service** :
1. Le client voit la liste des services avec leur durée moyenne
2. Il sélectionne un service
3. Le logo et le nom de l'entreprise s'affichent si un thème est configuré

**Étape 2 — Choix de la date et du créneau** :
1. Un **calendrier interactif** s'affiche (mois en cours)
2. Les jours **fermés** et **passés** sont désactivés (grisés)
3. Le client sélectionne un jour
4. Les **créneaux disponibles** sont chargés dynamiquement (`getAvailableSlots`)
5. Les créneaux sont calculés selon :
   - Les **horaires d'ouverture** de l'entreprise (`BusinessHours`)
   - Les **jours fermés** (`ClosedDate`)
   - Les **rendez-vous existants** (pas de chevauchement)
   - La **durée du service** (`avgTime`)
   - Marge minimum : **1 heure dans le futur**
   - Maximum : **90 jours** à l'avance
6. Le client sélectionne un créneau horaire

**Étape 3 — Informations personnelles** :
1. Le client remplit :
   - **Nom** (obligatoire, min 2 caractères)
   - **Email** (optionnel, pour les rappels)
   - **Téléphone** (optionnel, pour les rappels SMS)
   - **Notes** (optionnel, max 500 caractères)
2. Le client confirme le rendez-vous

**Après confirmation** :
- Le RDV est créé avec le statut `PENDING`
- Des **rappels** sont planifiés (24h et 1h avant) si email ou téléphone fourni
- Un **cancelToken** unique (UUID) est généré
- Un écran de succès affiche un **lien d'annulation** que le client peut copier

### 5.5 — Annuler un rendez-vous

**URL** : `/appointment/cancel/{cancelToken}`

1. Le client clique sur le lien d'annulation reçu
2. La page affiche les **détails du rendez-vous** (date, heure, service, statut)
3. Le client peut saisir une **raison d'annulation** (optionnel)
4. Il confirme l'annulation
5. Le statut passe à `CANCELLED`, la date et la raison sont enregistrées
6. **Sécurité** : seul le détenteur du `cancelToken` peut annuler (pas d'authentification requise)

### 5.6 — Voir l'affichage TV

**URL** : `/display/{pageName}`

Le client peut accéder à l'affichage public qui montre :
- Le **nom de l'entreprise** (et logo si thème configuré)
- Les tickets **appelés** (CALL) — mis en avant
- Les tickets **en cours** (IN_PROGRESS)
- Les **prochains** tickets en attente (max 10)
- L'**horloge** en temps réel
- Le nombre total de tickets en attente

---

## 6 — Parcours Staff (employé)

Le staff est un employé ajouté par le propriétaire. Il se connecte via Clerk avec l'email enregistré par l'OWNER.

### 6.1 — Page d'accueil (`/home`)

Quand un STAFF se connecte, il voit :
- La liste de ses **postes assignés** sous forme de cartes
- Chaque carte affiche le nom du poste avec un bouton "Ouvrir"
- S'il n'a aucun poste assigné, un message lui demande de contacter son administrateur

### 6.2 — Vue d'un poste (`/poste/[idPoste]`)

Le staff accède à un poste spécifique :
- La **file d'attente** s'affiche avec tous les tickets PENDING/CALL/IN_PROGRESS
- Chaque ticket montre : numéro, nom du client, service, temps d'attente estimé
- Un compteur de rafraîchissement automatique (5 secondes)
- Un bouton **"Appeler le suivant"** pour prendre le prochain ticket

### 6.3 — Traitement d'un ticket (`/call/[idPoste]`)

Quand le staff clique "Appeler le suivant" :

1. Le système cherche d'abord un ticket déjà en `CALL` ou `IN_PROGRESS` sur ce poste
2. S'il n'y en a pas, il prend le **premier ticket `PENDING`** de l'entreprise (FIFO)
3. Le ticket passe en **`CALL`** et est assigné au poste
4. Une **notification WhatsApp** est envoyée au client (si consentement donné)
5. L'écran affiche une **carte hero** avec :
   - Le numéro du ticket
   - Le nom du client
   - Le service
   - Le statut actuel (badge coloré)
6. Le staff a deux actions :
   - **"Démarrer le traitement"** → le ticket passe à `IN_PROGRESS`
   - **"Fin du traitement"** → le ticket passe à `FINISHED` → redirection vers la vue du poste

**Fonctionnalités supplémentaires** :
- Mode **plein écran** (F11)
- **Son de notification** quand un nouveau ticket arrive
- **Vérification d'accès** : un STAFF ne peut accéder qu'aux postes qui lui sont assignés

### 6.4 — Navbar du staff

Le staff ne voit que le lien **"Accueil"** dans la barre de navigation et l'icône de la page publique.

---

## 7 — Parcours Admin

L'admin est un employé avec le rôle `ADMIN`, promu par l'OWNER. Il a les mêmes droits que l'OWNER **sauf la gestion des employés**.

### 7.1 — Accès

L'admin voit les liens suivants dans la Navbar :
- **Accueil** — Tableau de bord avec tous les tickets + sections URL publiques
- **Vos services** — Créer/supprimer des services
- **Vos postes** — Créer/supprimer des postes
- **Tableau de bord** — Statistiques (total, résolus, en attente) + 10 derniers tickets
- **Feedbacks** — Statistiques de satisfaction + feedbacks récents
- **Rendez-vous** — Dashboard des rendez-vous (filtres, actions)
- **Horaires** — Configuration des horaires d'ouverture
- **Thème** — Personnalisation visuelle

### 7.2 — Fonctionnalités identiques à l'OWNER

Voir section 8 ci-dessous. La seule différence est que l'admin **ne peut pas** :
- Gérer les employés (page `/staff`)
- Définir le `pageName` initial

---

## 8 — Parcours Owner (propriétaire)

### 8.1 — Première connexion (onboarding)

1. L'utilisateur se connecte via Clerk (Google, GitHub, email/password)
2. `initUserSession` ne trouve aucune entreprise ni staff → **crée automatiquement une `Company`** avec l'email et le nom de l'utilisateur
3. Le rôle `OWNER` est attribué
4. L'OWNER est redirigé vers `/home`
5. En cliquant sur l'icône ⚙️, il ouvre les **Paramètres** et définit son `pageName` (identifiant unique de sa page publique, ex: `iss_kin`)
6. Une fois le `pageName` défini, les URL publiques deviennent actives :
   - `/page/iss_kin` — File d'attente
   - `/display/iss_kin` — Affichage TV
   - `/appointment/iss_kin` — Prise de RDV

### 8.2 — Page d'accueil (`/home`)

L'OWNER voit :

**Section "Affichage Public TV"** :
- URL copiable de l'affichage TV (`/display/{pageName}`)
- Boutons "Copier" et "Ouvrir dans un nouvel onglet"

**Section "Prise de Rendez-vous"** :
- URL copiable de la page de RDV (`/appointment/{pageName}`)
- Boutons "Copier" et "Ouvrir"

**Tableau de bord temps réel** :
- Indicateur de connexion (point vert + "Connecté" ou spinner)
- Liste de **tous les tickets** actifs (PENDING, CALL, IN_PROGRESS)
- Rafraîchissement automatique toutes les 5 secondes
- Pagination (10 tickets par page)
- Pour chaque ticket : numéro, client, service, poste, statut, temps d'attente

### 8.3 — Gestion des services (`/services`)

- **Créer un service** : nom + temps moyen (minutes)
- **Voir la liste** des services existants (nom, durée)
- **Supprimer** un service (avec confirmation)
- Rate limiting : 5 créations/min
- Validation Zod : nom (2-50 car.), avgTime (1-999 min)

### 8.4 — Gestion des postes (`/poste_list`)

- **Créer un poste** : nom + service associé
- **Voir la liste** des postes (nom, service lié)
- **Supprimer** un poste
- **Accéder** à un poste pour voir la file d'attente et traiter les tickets
- Rate limiting : 5 créations/min

### 8.5 — Gestion des employés (`/staff`) — OWNER uniquement

- **Ajouter un employé** : email + nom + rôle (ADMIN ou STAFF)
- **Modifier le rôle** d'un employé (basculer ADMIN ↔ STAFF)
- **Supprimer** un employé
- **Assigner/retirer des postes** à un employé
- Vérifications : l'employé ne peut pas déjà exister dans l'entreprise
- Rate limiting sur toutes les opérations

### 8.6 — Tableau de bord (`/dashboard`)

- **3 cartes statistiques** : Total tickets, Tickets résolus, Tickets en attente
- **10 derniers tickets servis** (FINISHED) avec détails

### 8.7 — Feedbacks (`/feedbacks`)

- **Statistiques** : note moyenne, total, distribution (1-5 étoiles), tendance 7j
- **Liste des feedbacks récents** : note, commentaire, client, service, date

### 8.8 — Dashboard rendez-vous (`/appointments`)

- **4 cartes statistiques** : Total, En attente, Confirmés, Annulés
- **Filtres** : par date (début/fin) et par statut
- **Liste des RDV** avec pour chacun :
  - Date/heure, client, service, statut (badge coloré)
  - **Actions** selon le statut :
    - PENDING → Confirmer / Annuler
    - CONFIRMED → Terminer / Marquer absent
    - CANCELLED/COMPLETED/NO_SHOW → Aucune action

### 8.9 — Configuration des horaires (`/settings/business-hours`)

**Horaires hebdomadaires** :
- Tableau des 7 jours (Lundi → Dimanche)
- Pour chaque jour : toggle Ouvert/Fermé + heure d'ouverture + heure de fermeture
- Sauvegarde par jour (bouton individuel par ligne)

**Fermetures exceptionnelles** :
- Ajouter une date de fermeture + raison optionnelle
- Voir la liste des fermetures à venir
- Supprimer une fermeture

### 8.10 — Personnalisation du thème (`/settings/theme`)

**Formulaire** :
- **URL du logo** : lien direct vers une image (PNG, JPG, SVG)
- **Couleur principale** : sélecteur natif + input hex (#RRGGBB)
- **Couleur d'accent** : sélecteur natif + input hex
- **Description** : texte court (max 300 car.) affiché sur les pages publiques
- Bouton "Réinitialiser" pour revenir aux valeurs par défaut

**Prévisualisation en temps réel** :
- Affichage du logo, nom, description
- Aperçu des boutons avec les couleurs choisies
- Aperçu des badges

---

## 9 — Système de tickets — Flux complet

```
CLIENT                          SYSTÈME                         STAFF/ADMIN
  │                                │                               │
  │  1. Accède à /page/{pageName}  │                               │
  │───────────────────────────────>│                               │
  │                                │  2. getServicesByPageName()   │
  │  3. Sélectionne service        │                               │
  │  4. Entre son nom              │                               │
  │  5. (opt) Numéro WhatsApp      │                               │
  │───────────────────────────────>│                               │
  │                                │  6. Validation Zod            │
  │                                │  7. Rate limiting             │
  │                                │  8. Génère numéro unique      │
  │                                │  9. Crée ticket (PENDING)     │
  │  10. Voit ticket + position    │                               │
  │                                │                               │
  │  [Polling 5s]                  │                               │
  │<──────────────────────────────>│                               │
  │                                │                               │
  │                                │                               │  11. Ouvre /call/{idPoste}
  │                                │<──────────────────────────────│
  │                                │  12. getLastTicketByEmail()   │
  │                                │  13. Premier PENDING → CALL   │
  │                                │  14. Assigne au poste         │
  │                                │  15. Notif WhatsApp           │
  │  16. Voit statut = CALL        │                               │
  │  "Rendez-vous au poste X"      │                               │  17. Voit ticket (carte hero)
  │                                │                               │
  │                                │                               │  18. Clic "Démarrer"
  │                                │<──────────────────────────────│
  │                                │  19. Ticket → IN_PROGRESS     │
  │  20. Voit statut = IN_PROGRESS │                               │
  │                                │                               │
  │                                │                               │  21. Clic "Fin du traitement"
  │                                │<──────────────────────────────│
  │                                │  22. Ticket → FINISHED        │
  │  23. Modal feedback apparaît   │                               │
  │  24. Note 1-5 + commentaire    │                               │
  │───────────────────────────────>│                               │
  │                                │  25. Crée Feedback en base    │
  │  26. "Merci !" affiché         │                               │
```

### Cycle de vie d'un ticket

```
PENDING ──→ CALL ──→ IN_PROGRESS ──→ FINISHED
                                        │
                                        ▼
                                    [Feedback]
```

---

## 10 — Système de rendez-vous — Flux complet

```
CLIENT                          SYSTÈME                         OWNER/ADMIN
  │                                │                               │
  │  1. /appointment/{pageName}    │                               │
  │───────────────────────────────>│                               │
  │                                │  2. getServicesByPageName()   │
  │                                │  3. getCompanyTheme()         │
  │                                │                               │
  │  4. [Étape 1] Choisit service  │                               │
  │  5. [Étape 2] Choisit date     │                               │
  │───────────────────────────────>│                               │
  │                                │  6. getAvailableSlots()       │
  │                                │     - Vérifie BusinessHours   │
  │                                │     - Vérifie ClosedDate      │
  │                                │     - Vérifie conflits RDV    │
  │  7. Voit créneaux disponibles  │                               │
  │  8. Sélectionne un créneau     │                               │
  │                                │                               │
  │  9. [Étape 3] Remplit infos    │                               │
  │  10. Confirme                  │                               │
  │───────────────────────────────>│                               │
  │                                │  11. Validation Zod           │
  │                                │  12. Rate limit (5/min/page)  │
  │                                │  13. Vérifie date > now + 1h  │
  │                                │  14. Vérifie date < now + 90j │
  │                                │  15. Vérifie horaires ouverture│
  │                                │  16. Vérifie pas jour fermé   │
  │                                │  17. Vérifie pas de conflit   │
  │                                │  18. Crée Appointment (PENDING)│
  │                                │  19. Planifie rappels         │
  │                                │  20. Génère cancelToken (UUID)│
  │  21. Écran succès              │                               │
  │  22. Lien d'annulation         │                               │
  │                                │                               │
  │                                │                               │  23. Voit RDV dans /appointments
  │                                │                               │  24. Clic "Confirmer"
  │                                │<──────────────────────────────│
  │                                │  25. RDV → CONFIRMED          │
  │                                │                               │
  │  [Jour J, le client se présente]                               │
  │                                │                               │  26. Clic "Terminé"
  │                                │<──────────────────────────────│
  │                                │  27. RDV → COMPLETED          │
```

### Annulation par le client

```
CLIENT                          SYSTÈME
  │                                │
  │  /appointment/cancel/{token}   │
  │───────────────────────────────>│
  │                                │  getAppointmentByToken(token)
  │  Voit détails du RDV           │
  │  Saisit raison (optionnel)     │
  │  Clic "Annuler"               │
  │───────────────────────────────>│
  │                                │  cancelAppointmentByToken()
  │                                │  RDV → CANCELLED
  │  "RDV annulé" affiché         │
```

### Cycle de vie d'un rendez-vous

```
                    ┌──→ CONFIRMED ──┬──→ CHECK-IN ──→ Ticket prioritaire ──→ COMPLETED
                    │                │
PENDING ────────────┤                ├──→ NO_SHOW (auto après +15 min sans check-in)
                    │                │
                    │                └──→ CANCELLED
                    │
                    └──→ CANCELLED
```

---

## 11 — Système hybride Tickets/RDV — Coexistence

### Problématique

Les tickets (walk-in) et les rendez-vous (réservations) doivent coexister sans conflit.
Scénario type : un client a un RDV à 14h00, mais 5 walk-ins prennent des tickets avant son arrivée.
Sans mécanisme de priorité, le client avec RDV attendrait comme tout le monde.

### Solution implémentée : Système hybride avec priorité

#### 1. Priorité des tickets (`TicketPriority`)

Chaque ticket a un champ `priority` :

| Priorité | Valeur | Description |
|----------|--------|-------------|
| **NORMAL** | `NORMAL` | Ticket walk-in classique (FIFO) |
| **APPOINTMENT** | `APPOINTMENT` | Ticket créé via le check-in d'un RDV → **prioritaire** |

Lorsqu'un staff appelle le prochain client (`getLastTicketByEmail`), le système :
1. Cherche d'abord un ticket `PENDING` avec `priority = APPOINTMENT`
2. S'il n'en trouve pas, prend le premier ticket `PENDING` avec `priority = NORMAL` (FIFO)

→ Les clients avec RDV **passent devant** les walk-ins.

#### 2. Check-in d'un RDV (`checkInAppointment`)

Quand un client avec un RDV se présente :
1. L'OWNER/ADMIN ouvre le dashboard `/appointments`
2. Si le RDV est `CONFIRMED` et dans la fenêtre **±30 min** autour de l'heure prévue :
   - Un bouton **"Check-in"** apparaît
3. Au clic, le système :
   - Crée un **ticket prioritaire** (`priority = APPOINTMENT`) lié au RDV via `appointmentId`
   - Met le RDV en `COMPLETED`
   - Le ticket entre dans la file avec une **priorité élevée**
4. Le staff voit le badge **📅 RDV** sur le ticket dans la vue poste et la vue d'appel

#### 3. Gestion automatique des NO_SHOW (`processNoShows`)

À chaque chargement du dashboard `/appointments`, le système détecte automatiquement les absents :
- **Conditions** : RDV `CONFIRMED` + heure dépassée de **>15 min** + aucun ticket créé (pas de check-in)
- **Action** : le RDV passe automatiquement à `NO_SHOW`
- Le créneau est libéré pour d'éventuels walk-ins

#### 4. Indicateurs visuels pour le staff

**Vue poste (`/poste/[idPoste]`)** :
- Section **"Rendez-vous du jour"** au-dessus de la file d'attente
- Chaque RDV affiche : nom du client, service, heure, durée
- Badges visuels dynamiques :
  - 🟡 **"Maintenant"** : RDV dans la fenêtre ±15 min (animation pulse)
  - 🔵 **"Bientôt"** : RDV dans les 60 prochaines minutes
  - ⚪ **"À venir"** : RDV plus tard dans la journée
  - 🟢 **"Check-in ✓"** : Le client s'est présenté et un ticket a été créé

**Vue appel (`/call/[idPoste]`)** :
- Badge **📅 RDV** visible sur la carte hero du ticket si `priority = APPOINTMENT`
- Le staff sait immédiatement qu'il s'agit d'un client avec rendez-vous

**Liste de tickets (`TicketComponent`)** :
- Badge **📅 RDV** affiché à côté du numéro de ticket

### Flux complet — Check-in d'un RDV

```
CLIENT arrive                    OWNER/ADMIN                         SYSTÈME
  │                                │                                    │
  │  Se présente à l'accueil       │                                    │
  │───────────────────────────────>│                                    │
  │                                │  Ouvre /appointments               │
  │                                │  (processNoShows auto)             │
  │                                │                                    │
  │                                │  Voit RDV CONFIRMED                │
  │                                │  Bouton "Check-in" visible         │
  │                                │  (fenêtre ±30 min)                 │
  │                                │                                    │
  │                                │  Clic "Check-in"                   │
  │                                │──────────────────────────────────>│
  │                                │                                    │  checkInAppointment()
  │                                │                                    │  → Crée Ticket (APPOINTMENT)
  │                                │                                    │  → RDV → COMPLETED
  │                                │                                    │
  │                                │                      STAFF au poste│
  │                                │                                    │  getLastTicketByEmail()
  │                                │                                    │  → Cherche APPOINTMENT d'abord
  │                                │                                    │  → Ticket RDV passe AVANT les walk-ins
  │                                │                                    │  → Ticket → CALL (badge 📅 RDV)
  │  Appelé au poste               │                                    │
```

### Règles métier résumées

| Règle | Détail |
|-------|--------|
| Priorité d'appel | `APPOINTMENT` > `NORMAL` (dans chaque priorité : FIFO) |
| Fenêtre de check-in | ±30 min autour de l'heure du RDV |
| NO_SHOW automatique | 15 min après l'heure du RDV si pas de check-in |
| 1 ticket par RDV | Contrainte `@unique` sur `Ticket.appointmentId` |
| Statut requis | Le RDV doit être `CONFIRMED` pour permettre le check-in |

---

## 12 — Estimation Intelligente (ML)

### Problème résolu

L'estimation du temps d'attente était **statique** : `position × service.avgTime` (valeur configurée manuellement par l'OWNER). Aucune donnée réelle n'était exploitée, l'estimation ne s'améliorait jamais.

### Solution : EWMA contextuel (Exponentially Weighted Moving Average)

Algorithme 100% TypeScript (zéro dépendance ML externe) qui s'auto-améliore avec l'historique réel des tickets.

#### Cycle de vie d'un ticket (timestamps trackés)

```
PENDING ──→ CALL ──→ IN_PROGRESS ──→ FINISHED
   │         │          │               │
createdAt  calledAt  startedAt     finishedAt
   │         │          │               │
   ├─────────┤          ├───────────────┤
   waitDuration       serviceDuration
```

#### Algorithme de prédiction

```
estimatedServiceTime = α × recentAvg + (1-α) × historicalAvg
  où α = 0.7 (poids fort sur les données récentes)

estimatedWaitTime = (queuePosition / activePostsCount) × estimatedServiceTime
  + marge file longue (+10% si > 10 tickets)
  + marge heure de pointe (+15% si détectée)
```

#### Niveaux de confiance (fallback progressif)

| Données historiques | Stratégie | Confiance | Badge |
|---------------------|-----------|-----------|-------|
| 0 tickets FINISHED | `service.avgTime` (statique) | Aucune | — |
| 1-9 tickets | Moyenne simple | Faible | `~` |
| 10-49 tickets | EWMA sans contexte horaire | Moyenne | `ML` jaune |
| 50+ tickets | EWMA + contexte heure/jour | Élevée | `ML` vert |

#### Features contextuelles utilisées

| Feature | Description |
|---------|-------------|
| `serviceDuration` historique | Durée réelle CALL→FINISHED par service |
| `hourOfDay` | Heure courante (±1h) pour détecter les patterns |
| `dayOfWeek` | Jour de la semaine (même jour = même pattern) |
| `activePostsCount` | Nombre de postes avec ticket IN_PROGRESS |
| `queueLength` | Taille de la file (marge si > 10) |
| Heures de pointe | Détectées quand volume > 130% de la moyenne |

### Intégration dans les vues

- **TicketComponent** : affiche l'estimation ML + badge de confiance au lieu du calcul statique
- **Page client `/page/{pageName}`** : tickets enrichis avec `estimatedWait` et `confidence`
- **Vue staff `/poste` et `/home`** : estimations ML visibles sur chaque ticket PENDING
- **Notifications WhatsApp** : utilise l'estimation ML (fallback vers `position × avgTime`)

### Dashboard de précision (`/estimation`)

Page réservée OWNER/ADMIN affichant :
- **Précision globale** : % de précision moyen pondéré
- **Tableau par service** : avgTime configuré vs durée réelle vs estimation ML, écart, confiance, échantillons
- **Heures de pointe** : détectées automatiquement par service
- **Bouton "Sync"** : met à jour le `avgTime` d'un service avec la durée réelle mesurée

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `lib/wait-time-estimator.ts` | Moteur EWMA (estimation, précision, détection heures de pointe) |
| `app/actions/estimation.ts` | Actions serveur (dashboard, sync avgTime, estimation publique) |
| `app/estimation/page.tsx` | Dashboard de précision (OWNER/ADMIN) |

---

## 13 — Système de feedback

### Flux

1. Un ticket passe à `FINISHED`
2. Côté client, le polling détecte le changement de statut
3. Le ticket est ajouté à la liste des `finishedTickets`
4. La `FeedbackModal` s'affiche automatiquement
5. Le client note (1-5 étoiles) et commente (optionnel)
6. `submitFeedback()` valide avec Zod et crée le `Feedback` en base
7. Un seul feedback par ticket (contrainte `@unique`)

### Statistiques disponibles (OWNER/ADMIN)

- **Moyenne générale** des notes
- **Distribution** par étoile (1★ à 5★)
- **Tendance** : comparaison semaine actuelle vs semaine précédente
- **Liste** des 20 derniers feedbacks avec : note, commentaire, client, service, poste

---

## 14 — Notifications WhatsApp

### Configuration

Variables d'environnement requises :
- `WHATSAPP_ENABLED` : `true` pour activer
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` : identifiants Twilio

### Déclencheurs

| Événement | Template | Contenu |
|-----------|----------|---------|
| Ticket proche d'être appelé | `ticket_approaching` | "Votre ticket {num} sera bientôt appelé. Temps estimé : {X} min" |
| Ticket appelé (CALL) | `ticket_called` | "Votre ticket {num} est appelé ! Rendez-vous au poste {poste}" |

### Fonctionnement

- Les notifications sont **non-bloquantes** (catch errors silently)
- Un ticket n'est notifié qu'une seule fois (`whatsappNotified` flag)
- Le `messageId` Twilio est stocké pour traçabilité
- Le seuil de notification (combien de positions avant l'appel) est configurable

---

## 15 — Affichage public TV

### URL : `/display/{pageName}`

**Fonctionnalités** :
- **Header** : nom de l'entreprise (+ logo si thème), indicateur de connexion, horloge temps réel
- **Section CALL** : tickets appelés avec animation (grande taille, mis en avant)
- **Section IN_PROGRESS** : tickets en cours de traitement
- **Section PENDING** : 10 prochains tickets en attente
- **Compteur** : nombre total de tickets en attente
- **Rafraîchissement** : polling toutes les 5 secondes
- **Son** : notification sonore quand un nouveau ticket est appelé (activable/désactivable)
- **Plein écran** : bouton pour passer en mode fullscreen
- **Wake Lock** : empêche l'écran de se mettre en veille (API Web)
- **Thème** : les couleurs personnalisées de l'entreprise s'appliquent au header

---

## 16 — Thème personnalisable

### Champs disponibles

| Champ | Type | Validation | Application |
|-------|------|------------|-------------|
| `logoUrl` | URL | URL valide, max 500 car. | Affiché sur les pages publiques (header) |
| `primaryColor` | Hex | `#RRGGBB` | CSS variable `--p` (DaisyUI primary) |
| `accentColor` | Hex | `#RRGGBB` | CSS variable `--a` (DaisyUI accent) |
| `description` | Texte | Max 300 car. | Affiché sous le nom sur les pages publiques |

### Pages impactées

- `/page/{pageName}` — Logo + nom + description + couleurs des boutons/badges
- `/appointment/{pageName}` — Idem
- `/display/{pageName}` — Logo dans le header + couleur du header

### Fonctionnement technique

Le composant `CompanyThemeProvider` :
1. Reçoit les couleurs en props (côté serveur ou client)
2. Injecte les CSS custom properties DaisyUI (`--p`, `--a`) via `document.documentElement.style`
3. Convertit les couleurs hex en HSL (format DaisyUI)
4. Affiche le logo, le nom et la description en en-tête
5. Nettoie les styles au démontage (`return cleanup`)

---

## 17 — Sécurité

### Authentification

- **Clerk** gère l'authentification (OAuth, email/password, sessions)
- Le middleware (`proxy.ts`) protège toutes les routes **sauf** les routes publiques
- Les routes publiques : `/`, `/sign-in`, `/sign-up`, `/page/*`, `/landing`, `/offline`, `/display/*`, `/appointment/*`

### Autorisation

- **`verifyCompanyOwnership(email)`** : vérifie que l'email Clerk correspond à l'email de l'entreprise
- **`verifyStaffAccess()`** : identifie l'utilisateur (OWNER/ADMIN/STAFF) et retourne son `companyId`
- Chaque server action vérifie le rôle requis avant d'exécuter la logique métier

### Validation des entrées

- **Zod** valide toutes les entrées utilisateur côté serveur
- Schémas définis dans `lib/validation.ts` :
  - `serviceNameSchema` : nom de service (2-50 car., trimmed, pas de caractères dangereux)
  - `pageNameSchema` : pageName (3-30 car., alphanumériques + underscore)
  - `customerNameSchema` : nom client (2-100 car.)
  - `emailSchema` : email valide
  - `appointmentSchema` : données de rendez-vous complètes
  - `businessHoursSchema` : horaires (format HH:mm)
  - `feedbackSchema` : rating 1-5, commentaire max 500
  - `themeSchema` : URL logo, couleurs hex, description

### Rate limiting

Système en mémoire (`lib/ratelimit.ts`) avec fenêtre glissante :

| Action | Limite | Fenêtre |
|--------|--------|---------|
| Créer un ticket | 10/min par page | 60s |
| Créer un service | 5/min par email | 60s |
| Créer un poste | 5/min par email | 60s |
| Supprimer un service/poste | 10/min par email | 60s |
| Mettre à jour un ticket | 20/min par ticket | 60s |
| Créer un rendez-vous | 5/min par page | 60s |
| Ajouter/retirer staff | 10/min par email | 60s |

### Protection contre les attaques

- **XSS** : React échappe automatiquement le HTML ; pas de `dangerouslySetInnerHTML`
- **CSRF** : Server Actions de Next.js avec vérification d'origine
- **SQL Injection** : Prisma ORM (requêtes paramétrées)
- **Brute force** : Rate limiting sur toutes les actions sensibles
- **Token d'annulation RDV** : UUID v4 aléatoire (non prédictible)
- **Secrets** : toutes les clés en variables d'environnement (`.env`)

---

## 18 — Routes et middleware

### Middleware (`proxy.ts`)

```typescript
const isPublicRoute = createRouteMatcher([
  '/',                  // Landing page
  '/sign-in(.*)',       // Connexion Clerk
  '/sign-up(.*)',       // Inscription Clerk
  '/page(.*)',          // Page publique de ticket
  '/landing',           // Landing page alternative
  '/offline',           // Page hors-ligne (PWA)
  '/display(.*)',       // Affichage public TV
  '/appointment(.*)',   // Prise de RDV + annulation
])
```

Toute route **non listée** nécessite une authentification Clerk (`auth.protect()`).

### Résumé des routes

| Route | Type | Auth | Rôle requis | Description |
|-------|------|:----:|:-----------:|-------------|
| `/` | Page | ❌ | — | Landing page |
| `/landing` | Page | ❌ | — | Landing page (alternative) |
| `/sign-in` | Page | ❌ | — | Connexion Clerk |
| `/sign-up` | Page | ❌ | — | Inscription Clerk |
| `/page/{pageName}` | Page | ❌ | — | Prise de ticket (client) |
| `/appointment/{pageName}` | Page | ❌ | — | Prise de RDV (client) |
| `/appointment/cancel/{token}` | Page | ❌ | — | Annulation de RDV (client) |
| `/display/{pageName}` | Page | ❌ | — | Affichage TV |
| `/offline` | Page | ❌ | — | Page hors-ligne PWA |
| `/home` | Page | ✅ | ALL | Tableau de bord principal |
| `/services` | Page | ✅ | OWNER/ADMIN | Gestion des services |
| `/poste_list` | Page | ✅ | OWNER/ADMIN | Gestion des postes |
| `/poste/{id}` | Page | ✅ | ALL | Vue file d'attente d'un poste |
| `/call/{id}` | Page | ✅ | ALL | Traitement ticket sur un poste |
| `/staff` | Page | ✅ | OWNER | Gestion des employés |
| `/dashboard` | Page | ✅ | OWNER/ADMIN | Statistiques tickets |
| `/feedbacks` | Page | ✅ | OWNER/ADMIN | Statistiques feedbacks |
| `/appointments` | Page | ✅ | OWNER/ADMIN | Dashboard rendez-vous |
| `/estimation` | Page | ✅ | OWNER/ADMIN | Estimations ML (précision, sync avgTime) |
| `/settings/business-hours` | Page | ✅ | OWNER/ADMIN | Configuration horaires |
| `/settings/theme` | Page | ✅ | OWNER/ADMIN | Personnalisation visuelle |

---

## 19 — Arborescence des pages

```
/                               ← Landing page (public)
├── /sign-in                    ← Connexion Clerk
├── /sign-up                    ← Inscription Clerk
├── /landing                    ← Landing alternative
├── /offline                    ← Page hors-ligne PWA
│
├── /page/{pageName}            ← [PUBLIC] Prise de ticket
├── /display/{pageName}         ← [PUBLIC] Affichage TV
├── /appointment/{pageName}     ← [PUBLIC] Prise de RDV
├── /appointment/cancel/{token} ← [PUBLIC] Annulation RDV
│
├── /home                       ← [AUTH] Tableau de bord (adaptif selon rôle)
│   ├── STAFF → Mes postes assignés
│   └── OWNER/ADMIN → File d'attente + URLs publiques
│
├── /services                   ← [OWNER/ADMIN] Gestion des services
├── /poste_list                 ← [OWNER/ADMIN] Gestion des postes
├── /poste/{idPoste}            ← [AUTH] Vue file d'attente d'un poste
├── /call/{idPoste}             ← [AUTH] Traitement du ticket au poste
│
├── /staff                      ← [OWNER] Gestion des employés
├── /dashboard                  ← [OWNER/ADMIN] Statistiques tickets
├── /feedbacks                  ← [OWNER/ADMIN] Statistiques feedbacks
├── /appointments               ← [OWNER/ADMIN] Dashboard rendez-vous
├── /estimation                 ← [OWNER/ADMIN] Estimations ML
│
└── /settings/
    ├── business-hours          ← [OWNER/ADMIN] Configuration horaires
    └── theme                   ← [OWNER/ADMIN] Personnalisation visuelle
```

---

## 20 — Diagrammes de flux

### 20.1 — Flux d'authentification et détermination du rôle

```
Utilisateur se connecte via Clerk
         │
         ▼
  initUserSession(email, name)
         │
         ├── Email = Company.email ?
         │         │
         │         YES → rôle = OWNER
         │
         ├── Email = Staff.email ?
         │         │
         │         YES → rôle = Staff.role (ADMIN ou STAFF)
         │
         └── Sinon → Créer Company → rôle = OWNER
```

### 20.2 — Flux d'appel d'un ticket (Staff)

```
Staff clique "Appeler le suivant"
         │
         ▼
  getLastTicketByEmail(email, idPoste)
         │
         ├── Ticket CALL/IN_PROGRESS sur ce poste ?
         │         │
         │         YES → Afficher ce ticket
         │
         └── NON → Chercher prochain PENDING :
                    │
                    ├── 1. Ticket PENDING avec priority = APPOINTMENT ? (FIFO)
                    │         │
                    │         OUI → Ce ticket est prioritaire (client avec RDV)
                    │
                    └── 2. Sinon → Premier ticket PENDING (NORMAL, FIFO)
                              │
                              ▼
                    Ticket.status = CALL
                    Ticket.postId = poste
                    Ticket.postName = nom du poste
                              │
                              ▼
                    Notification WhatsApp (async, non-bloquant)
                              │
                              ▼
                    Afficher la carte hero du ticket
                    (badge 📅 RDV si priority = APPOINTMENT)
```

### 20.3 — Flux de calcul des créneaux disponibles

```
getAvailableSlots(pageName, serviceId, dateStr)
         │
         ├── 1. Trouver l'entreprise par pageName
         ├── 2. Trouver le service (vérifier qu'il appartient à l'entreprise)
         ├── 3. Vérifier BusinessHours pour ce jour de semaine
         │         └── Fermé ? → retourner []
         ├── 4. Vérifier ClosedDate pour cette date
         │         └── Fermé ? → retourner []
         ├── 5. Récupérer les RDV existants PENDING/CONFIRMED ce jour
         │
         └── 6. Pour chaque créneau entre openTime et closeTime :
                    │
                    ├── Créneau dans le passé (+ 1h marge) ? → skip
                    ├── Conflit avec un RDV existant ? → skip
                    └── OK → ajouter à la liste
```

---

## 📊 Résumé des technologies de temps réel

| Fonctionnalité | Méthode | Intervalle |
|---------------|---------|-----------|
| File d'attente côté client (`/page`) | Polling (setInterval) | 5 secondes |
| File d'attente côté staff (`/poste`) | Polling (setTimeout récursif) | 5 secondes |
| Tableau de bord OWNER (`/home`) | Polling (setInterval) | 5 secondes |
| Affichage TV (`/display`) | Polling (setInterval) | 5 secondes |
| Horloge affichage TV | Polling (setInterval) | 1 seconde |

---

**Document généré à partir de l'analyse exhaustive du code source de SmartQueue.**  
**Toute modification du code doit entraîner une mise à jour de ce document.**
