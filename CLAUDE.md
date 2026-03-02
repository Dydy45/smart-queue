# 🚀 SmartQueue - Suggestions d'Amélioration

## Table des matières
1. [Sécurité](#sécurité)
2. [Performance](#performance)
3. [Expérience Utilisateur (UX/UI)](#expérience-utilisateur-uxui)
4. [Code Quality & Architecture](#code-quality--architecture)
5. [Fonctionnalités Manquantes](#fonctionnalités-manquantes)
6. [Données & Analytics](#données--analytics)
7. [Déploiement & Infrastructure](#déploiement--infrastructure)

---

## 🔐 Sécurité

### 1. **Validation des entrées insuffisante**
**Sévérité**: HAUTE
**Fichiers concernés**: `app/actions.ts`, `app/page/[pageName]/page.tsx`

**Problèmes**:
- Les noms de service, postes et clients ne sont pas validés
- Absence de vérification de longueur/format
- Risque de XSS si les données ne sont pas échappées correctement
- `pageName` peut contenir des caractères dangereux

**Solutions**:
```typescript
// Créer un fichier: lib/validation.ts
import { z } from 'zod'

export const serviceNameSchema = z.string()
  .min(1, 'Le nom du service ne peut pas être vide')
  .max(50, 'Le nom du service ne peut pas dépasser 50 caractères')
  .trim()

export const pageNameSchema = z.string()
  .min(3, 'Le nom de page doit contenir au moins 3 caractères')
  .max(30, 'Le nom de page ne peut pas dépasser 30 caractères')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom de page ne peut contenir que des lettres, chiffres, tirets et underscores')
  .toLowerCase()

export const customerNameSchema = z.string()
  .min(1, 'Le nom ne peut pas être vide')
  .max(100, 'Le nom ne peut pas dépasser 100 caractères')
  .trim()
```
Utiliser `zod` ou `joi` pour valider toutes les entrées utilisateur.

---

### 2. **Authentification: Validation du propriétaire de l'entreprise manquante**
**Sévérité**: CRITIQUE
**Fichiers concernés**: `app/actions.ts`

**Problèmes**:
- Aucune vérification que l'utilisateur authentifié possède l'entreprise
- Un hacker peut modifier les services/postes/tickets d'une autre entreprise avec le bon UUID
- Les fonctions acceptent `email` comme paramètre au lieu d'utiliser l'utilisateur Clerk authentifié

**Solutions**:
```typescript
// Ajouter en haut de actions.ts
import { currentUser } from '@clerk/nextjs/server'

// Créer une fonction helper pour vérifier l'propriété
export async function verifyCompanyOwnership(email: string) {
  const user = await currentUser()
  if (!user?.primaryEmailAddress?.emailAddress) {
    throw new Error('Utilisateur non authentifié')
  }
  if (user.primaryEmailAddress.emailAddress !== email) {
    throw new Error('Accès non autorisé à cette entreprise')
  }
}

// Utiliser dans chaque action:
export async function createService(serviceName: string, avgTime: number) {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress

  if (!email) throw new Error('Non authentifié')
  await verifyCompanyOwnership(email) // NOUVEAU!

  // reste du code...
}
```

---

### 3. **Génération de numéros de ticket non sécurisée**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/actions.ts` ligne 155

**Problèmes**:
```typescript
const ticketNum = `A${Math.floor(Math.random() * 10000)}`
```
- `Math.random()` n'est pas cryptographiquement sûr
- Seulement 10,000 combinaisons possibles → collisions prévisibles
- Quelqu'un peut deviner les numéros de ticket d'autres clients

**Solutions**:
```typescript
import crypto from 'crypto'

function generateTicketNumber(): string {
  // Option 1: Utiliser des caractères alphanumériques
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'T'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(crypto.getRandomValues(new Uint8Array(1))[0] % chars.length)
  }
  return result
}

// Option 2: Utiliser un timestamp + random (plus court)
// T20250301-A4K9L
function generateTicketNumber(): string {
  const date = Date.now().toString(36)
  const random = crypto.getRandomValues(new Uint8Array(4))
    .reduce((acc, byte) => acc + byte.toString(36), '')
  return `T${date}${random}`.toUpperCase().substring(0, 10)
}
```

---

### 4. **Pas de limite de requêtes (Rate Limiting)**
**Sévérité**: MOYENNE
**Fichiers concernés**: Toutes les `actions.ts`

**Risques**:
- Quelqu'un peut spammer la création de tickets
- Attaques de force brute possibles
- Déni de service (DoS) possible

**Solutions**:
```typescript
// Utiliser npm: npm install redis
// Ou utiliser: npm install ioredis
// Configuration rate limiting en middleware Clerk ou middleware NextJS

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requêtes par minute
})

export async function createTicket(serviceId: string, nameComplete: string, pageName: string) {
  const { success } = await ratelimit.limit(`ticket-creation-${pageName}`)

  if (!success) {
    throw new Error('Trop de tentatives. Veuillez réessayer dans une minute.')
  }
  // reste du code...
}
```

---

### 5. **Stockage localStorage non sécurisé**
**Sévérité**: BASSE
**Fichiers concernés**: `app/page/[pageName]/page.tsx` lignes 41-51

**Problèmes**:
```typescript
const ticketNumsFromStorage = localStorage.getItem('ticketNums')
```
- N'importe qui peut modifier les localStorage du client
- Un attaquant peut voir les numéros de ticket d'autres clients s'ils voient l'écran
- Données non chiffrées

**Solutions**:
- Ne pas stocker les données sensibles en localStorage
- Utiliser les cookies httpOnly si vraiment nécessaire
- Meilleure solution: Garder l'historique des tickets en base de données pour chaque session client anonyme

---

### 6. **CORS et en-têtes de sécurité**
**Sévérité**: BASSE
**Fichiers concernés**: `next.config.ts`

**Solutions**:
```typescript
// Dans next.config.ts
export default {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

---

## ⚡ Performance

### 1. **Polling toutes les 5 secondes (inefficace)**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/page.tsx`, `app/page/[pageName]/page.tsx`

**Problèmes**:
- Beaucoup de requêtes inutiles si rien ne change
- Utilisation de bande passante excessive
- Latence de 0-5 secondes pour les mises à jour
- Impact sur l'infrastructure à scale

**Solutions - Option 1: WebSockets (Meilleur)**:
```typescript
// Utiliser: npm install socket.io socket.io-client
// Ou: npm install ws

// lib/socket.ts
import { io } from 'socket.io-client'

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000')

// Dans page.tsx
useEffect(() => {
  socket.on('ticketsUpdated', (newTickets) => {
    setTickets(newTickets)
  })

  return () => {
    socket.off('ticketsUpdated')
  }
}, [])
```

**Solutions - Option 2: Server-Sent Events (SSE)**:
```typescript
// Utiliser npm: npm install eventsource

// app/api/updates/route.ts
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const email = searchParams.get('email')

  const stream = new ReadableStream({
    async start(controller) {
      // On notify quand les tickets changent, envoyer une mise à jour
      // ...
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

// Dans page.tsx
useEffect(() => {
  const eventSource = new EventSource(`/api/updates?email=${email}`)

  eventSource.onmessage = (event) => {
    const newTickets = JSON.parse(event.data)
    setTickets(newTickets)
  }

  return () => eventSource.close()
}, [email])
```

---

### 2. **Nombreuses requêtes N+1**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/actions.ts` - getPendingTicketsByEmail (ligne 174)

**Problèmes**:
```typescript
const company = await prisma.company.findUnique({...})
// 1 requête

const services = await prisma.service.findMany({
  include: {
    tickets: {...}, // N requêtes si N services
  }
})
```

**Solutions**:
```typescript
export async function getPendingTicketsByEmail(email: string) {
  // Une seule requête avec tous les includes
  const tickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["PENDING", "CALL", "IN_PROGRESS"] },
      service: {
        company: { email }
      }
    },
    include: {
      service: true,
      post: true
    },
    orderBy: { createdAt: 'asc' }
  })

  return tickets.map(ticket => ({
    ...ticket,
    serviceName: ticket.service.name,
    avgTime: ticket.service.avgTime
  }))
}
```

---

### 3. **Pas de cache Redis/Memcached**
**Sévérité**: BASSE À MOYENNE (selon le scale)

**Solutions**:
```typescript
// npm install redis
import { redis } from '@/lib/redis'

export async function getServiceByEmail(email: string) {
  const cacheKey = `services:${email}`

  // Vérifier le cache d'abord
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Si pas en cache, récupérer de la DB
  const services = await prisma.service.findMany({
    where: { company: { email } }
  })

  // Mettre en cache pendant 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(services))

  return services
}
```

---

### 4. **Images et assets non optimisés**
**Sévérité**: BASSE

**Solutions**:
- Utiliser `next/image` au lieu de `<img>`
- Compresser les SVG
- Lazy load les images

---

### 5. **Bundle JavaScript trop gros**
**Sévérité**: BASSE

**Solutions**:
```typescript
// Dans next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // config
})

// Exécuter: npm run build -> ANALYZE=true npm run build
```

---

## 🎨 Expérience Utilisateur (UX/UI)

### 1. **Pas de notifications/alertes utilisateur**
**Sévérité**: MOYENNE
**Fichiers concernés**: Presque tous les fichiers

**Problèmes**:
- Les erreurs surviennent silencieusement (juste dans console.error)
- L'utilisateur ne sait pas si son action a réussi
- Pas de feedback visuel pour les actions longues

**Solutions**:
```typescript
// npm install react-hot-toast sonner
// Ou utiliser DaisyUI toast

import { useToast } from '@/lib/useToast' // Custom hook

export async function createTicket(...) {
  const { showSuccess, showError } = useToast()

  try {
    const ticketNum = await createTicket(...)
    showSuccess(`Ticket ${ticketNum} créé avec succès!`)
  } catch (error) {
    showError(error.message || 'Erreur lors de la création du ticket')
  }
}
```

---

### 2. **Pas d'état de chargement visible**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/page/[pageName]/page.tsx` ligne 87, etc.

**Problèmes**:
- L'utilisateur clique sur "Go" et rien ne se passe visuellement
- Pas de spinner de chargement
- Confusion si le bouton est en train de charger ou si c'est terminé

**Solutions**:
```typescript
const [isLoading, setIsLoading] = useState(false)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    const ticketNum = await createTicket(...)
    // succès
  } finally {
    setIsLoading(false)
  }
}

return (
  <button
    type="submit"
    className='btn btn-primary w-fit'
    disabled={isLoading}
  >
    {isLoading ? <span className='loading loading-spinner'></span> : 'Go'}
  </button>
)
```

---

### 3. **Messages d'erreur en anglais/non traduits**
**Sévérité**: BASSE
**Fichiers concernés**: `app/actions.ts`

```typescript
// Actuellement:
throw new Error(`Aucune entreprise trouvée avec le nom de page : ${pageName}`)

// Solution: Créer un système de messages i18n
// npm install next-intl
```

---

### 4. **Pages non réactives sur mobile**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/page/[pageName]/page.tsx` ligne 139

**Problèmes**:
- Un peu mieux avec Tailwind, mais certains éléments pourraient être mieux optimisés
- Les formulaires prennent trop de place sur petits écrans

**Solutions**:
```typescript
// Mieux utiliser les breakpoints Tailwind
<div className='flex flex-col lg:flex-row w-full gap-4'>
  <form className='w-full lg:w-96'>
    {/* form */}
  </form>
  <div className='w-full'>
    {/* tickets */}
  </div>
</div>
```

---

### 5. **Pas de dark mode**
**Sévérité**: BASSE
**Note**: DaisyUI supporte déjà le dark mode, juste manque le toggle

**Solutions**:
```typescript
// Ajouter dans Navbar.tsx
const [isDark, setIsDark] = useState(false)

useEffect(() => {
  const html = document.documentElement
  html.setAttribute('data-theme', isDark ? 'dark' : 'valentine')
}, [isDark])

return (
  <button onClick={() => setIsDark(!isDark)}>
    {isDark ? <Sun /> : <Moon />}
  </button>
)
```

---

### 6. **Pas d'accessibilité (a11y)**
**Sévérité**: BASSE

**Solutions**:
- Ajouter `aria-labels` sur tous les boutons
- Vérifier le contraste des couleurs (WCAG AA)
- Tester avec lecteur d'écran

---

### 7. **Pagination manquante pour les tickets**
**Sévérité**: BASSE

**Solutions**:
```typescript
// Pour les grandes listes de tickets, ajouter pagination
const TICKETS_PER_PAGE = 10

const paginatedTickets = tickets.slice(
  (page - 1) * TICKETS_PER_PAGE,
  page * TICKETS_PER_PAGE
)
```

---

### 8. **Interface du staff pas optimale**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/call/[idPoste]/page.tsx` (non revu)

**Solutions envisagées**:
- Ajouter un mode "fullscreen" pour le staff
- Mettre à jour l'écran automatiquement quand un nouveau ticket arrive
- Ajouter un son de notification (option)
- Meilleure visibilité du ticket actuel

---

## 🧹 Code Quality & Architecture

### 1. **Pas de gestion d'erreurs cohérente**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/actions.ts`

**Problèmes**:
```typescript
} catch (error) {
    console.error(error) // Juste log, pas de retour
    // La fonction retourne undefined silencieusement
}
```

**Solutions**:
```typescript
// Créer AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

// Utiliser dans les actions
export async function getServiceByEmail(email: string) {
  if (!email) {
    throw new AppError('Email manquant', 400, 'MISSING_EMAIL')
  }
  try {
    // ...
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('Erreur interne du serveur', 500, 'INTERNAL_ERROR')
  }
}
```

---

### 2. **Pas de logging structuré**
**Sévérité**: BASSE

**Solutions**:
```typescript
// npm install winston pino
// Créer lib/logger.ts
import { pino } from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: { colorize: true }
        }
      : undefined
})

// Utiliser:
logger.info({ email, serviceName }, 'Service created')
logger.error({ error }, 'Failed to create service')
```

---

### 3. **Métadonnées du HTML manquantes**
**Sévérité**: BASSE
**Fichiers concernés**: `app/layout.tsx` ligne 16-19

```typescript
export const metadata: Metadata = {
  title: "Create Next App", // ❌ Générique
  description: "Generated by create next app", // ❌ Générique
};
```

**Solutions**:
```typescript
export const metadata: Metadata = {
  title: "SmartQueue - Gestion de files d'attente",
  description: "Système de gestion de files d'attente pour les entreprises. Créez des tickets, gérez les files d'attente en temps réel.",
  keywords: ['queue management', 'gestion de file', 'tickets', 'attente'],
  authors: [{ name: 'SmartQueue Team' }],
  openGraph: {
    title: 'SmartQueue',
    description: 'Gestion de files d\'attente',
    type: 'website',
  }
};
```

---

### 4. **ESLint warnings à ignorer**
**Sévérité**: BASSE
**Fichiers concernés**: Plusieurs fichiers ont des `// eslint-disable-next-line`

**Solution**: Corriger le problème au lieu de désactiver la règle

---

### 5. **Typage TypeScript incomplet**
**Sévérité**: BASSE
**Fichiers concernés**: `app/page/[pageName]/page.tsx` ligne 21

```typescript
const [ticketNums, setTicketNums] = useState<any[]>([])

// ❌ Utiliser any

// ✅ Mieux:
const [ticketNums, setTicketNums] = useState<string[]>([])
```

---

### 6. **Pas de tests**
**Sévérité**: MOYENNE

**Solutions**:
```typescript
// npm install jest @testing-library/react

// __tests__/actions.test.ts
describe('createService', () => {
  it('should create a service', async () => {
    const result = await createService('test@example.com', 'Service Test', 30)
    expect(result).toBeDefined()
  })

  it('should throw if email is invalid', async () => {
    await expect(createService('', 'Service', 30))
      .rejects
      .toThrow()
  })
})
```

---

### 7. **Pas de documentation**
**Sévérité**: BASSE

**Solutions**:
- Créer un README.md avec installation et usage
- Ajouter des commentaires JSDoc sur les fonctions publiques
- Créer une architecture documentation (Storybook pour les composants)

---

## ✨ Fonctionnalités Manquantes

### 1. **Gestion des utilisateurs staff/employés**
**Sévérité**: MOYENNE

**Impact**: Les administrateurs ne peuvent pas gérer qui peut accéder à l'application

**Solutions**:
- Ajouter un système de roles (ADMIN, STAFF)
- Pouvoir inviter des employés
- Pouvoir modifier les permissions

---

### 2. **Assignation de tickets aux postes**
**Sévérité**: MOYENNE

**Problèmes actuels**:
- Les tickets ne sont assignés à un poste que quand on les appelle
- Pas de possibilité de gérer plusieurs files en parallèle

**Solutions**:
- Permettre à un ticket d'aller à un poste spécifique basé sur le service
- Afficher la file d'attente pour chaque poste

---

### 3. **Priorités des tickets**
**Sévérité**: BASSE

**Fonctionnalité**: Certains tickets pourraient avoir une priorité plus haute

**Solutions**:
- Ajouter un champ `priority` à Ticket
- Permettre aux clients de sélectionner une priorité
- Trier les tickets par priorité puis par date

---

### 4. **Historique et audit trail**
**Sévérité**: BASSE

**Solutions**:
- Enregistrer qui a changé le statut d'un ticket et quand
- Pouvoir voir l'historique complet d'un ticket
- Audit logging pour les opérations sensibles

---

### 5. **Export/Rapports**
**Sévérité**: BASSE

**Solutions**:
- Exporter les 10 derniers tickets en PDF
- Rapport journalier/hebdomadaire/mensuel
- Graphiques d'activité (tickets par heure, etc.)

---

### 6. **Notifications réelles (SMS/Email)**
**Sévérité**: BASSE

**Solutions**:
- Envoyer un email quand un ticket est créé
- Envoyer un SMS/email quand c'est le tour du client
- Notifications push via PWA

---

### 7. **File d'attente virtuelle**
**Sévérité**: BASSE

**Fonctionnalité**: Le client ne doit pas être physiquement présent - il peut revenir quand c'est son tour

**Solutions**:
- Envoyer un SMS/Email au client quand c'est son tour
- Ajouter un délai (ex: 15 minutes) pour la client de se présenter

---

## 📊 Données & Analytics

### 1. **Dashboard limite**
**Sévérité**: BASSE

**Améliorations**:
- Graphiques d'activité (tickets par heure/jour)
- Temps moyen d'attente
- Temps moyen de traitement
- Staff moins/plus productif
- Comparaison avec la période précédente

---

### 2. **Prédictions de temps d'attente imprecises**
**Sévérité**: MOYENNE
**Fichiers concernés**: `app/page.tsx` ligne 79, `app/components/TicketComponent.tsx`

**Problèmes**:
```typescript
const totalWaitTime = tickets
  .slice(0, index)
  .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)
```
- Utilise l'`avgTime` défini par l'admin
- Pas basé sur les données réelles

**Solutions**:
```typescript
// Calculer le temps réellement pris pour les tickets
async function getActualAverageTime(serviceId: string) {
  const finishedTickets = await prisma.ticket.findMany({
    where: {
      serviceId,
      status: 'FINISHED'
    },
    orderBy: { createdAt: 'desc' },
    take: 50 // Utiliser les 50 derniers tickets
  })

  if (finishedTickets.length === 0) {
    return await getAvgTimeConfig(serviceId)
  }

  // Calculer durée moyenne
  const durations = finishedTickets.map(t => {
    const duration = new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()
    return duration / 60000 // minutes
  })

  return durations.reduce((a, b) => a + b, 0) / durations.length
}

// Mettre à jour la BD chaque semaine
```

---

### 3. **Pas de tracking de temps de traitement**
**Sévérité**: BASSE

**Solutions**:
```typescript
// Ajouter à schema.prisma
model Ticket {
  // ...
  startedAt?: DateTime
  completedAt?: DateTime

  // Calculé: processingTime = completedAt - startedAt
  // Calculé: waitTime = startedAt - createdAt
}

// Mettre à jour dans actions.ts
await prisma.ticket.update({
  where: { id: ticketId },
  data: {
    status: 'IN_PROGRESS',
    startedAt: new Date(),
  }
})

await prisma.ticket.update({
  where: { id: ticketId },
  data: {
    status: 'FINISHED',
    completedAt: new Date(),
  }
})
```

---

## 🚀 Déploiement & Infrastructure

### 1. **Pas de migrations de base de données planifiées**
**Sévérité**: MOYENNE

**Solutions**:
```bash
# Chaque changement du schema
npx prisma migrate dev --name add_feature_name

# En production
npx prisma migrate deploy
```

---

### 2. **Database SQLite pour production**
**Sévérité**: CRITIQUE

**Problèmes**:
- SQLite est un fichier local
- Pas de support pour concurrent writes
- Support limité à une seule instance
- Perte de données si le serveur crash

**Solutions (Par ordre de préférence)**:
1. **PostgreSQL** (recommandé)
   ```typescript
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url = env("DATABASE_URL")
   }
   ```
   - Très scalable
   - Support transactions ACID
   - Gratuit sur Railway, Vercel Postgres, Supabase

2. **MySQL/MariaDB**
   ```typescript
   datasource db {
     provider = "mysql"
     url = env("DATABASE_URL")
   }
   ```

3. **MongoDB** (si plus flexible)
   ```typescript
   datasource db {
     provider = "mongodb"
     url = env("DATABASE_URL")
   }
   ```

---

### 3. **Pas de variables d'environnement sensibles**
**Sévérité**: MOYENNE

**Solutions**:
```bash
# .env.local (ne jamais commiter)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
DATABASE_URL="postgresql://..."

# .env.example (commiter)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
```

---

### 4. **Pas de CI/CD**
**Sévérité**: MOYENNE

**Solutions (Github Actions)**:
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npm run lint
      - run: npm run build
      - run: npm run test

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel --prod --token=$VERCEL_TOKEN
```

---

### 5. **Pas de monitoring/alerting**
**Sévérité**: BASSE

**Solutions**:
- Utiliser Sentry pour les erreurs
- Utiliser LogRocket pour le user session replay
- Mettre en place des alertes Slack

---

### 6. **Clerk configuration minimale**
**Sévérité**: BASSE

**Solutions**:
```typescript
// .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
```

---

## 📋 Résumé des Priorités

### Critique (Faire ASAP)
- [ ] Ajouter validation des entrées (zod)
- [ ] Vérifier l'authentification (ownership)
- [ ] Changer SQLite → PostgreSQL

### Haute (Dans le prochain sprint)
- [ ] Ajouter rate limiting
- [ ] Implémenter WebSockets ou SSE
- [ ] Ajouter gestion d'erreurs cohérente
- [ ] Ajouter notifications toast aux utilisateurs
- [ ] Ajouter state de chargement aux boutons

### Moyenne (À court terme)
- [ ] Ajouter tests unitaires
- [ ] Corriger les ESLint warnings
- [ ] Améliorer le typage TypeScript
- [ ] Ajouter logging structuré
- [ ] Implémenter CI/CD

### Basse (Nice to have)
- [ ] Ajouter dark mode toggle
- [ ] Améliorer le dashboard
- [ ] Ajouter exportation de rapports
- [ ] Ajouter accessibilité (a11y)
- [ ] Améliorer métadonnées SEO

---

## 🔧 Dépendances Recommandées à Ajouter

```bash
npm install zod                    # Validation
npm install @upstash/ratelimit     # Rate limiting
npm install redis                  # Caching
npm install sonner                 # Notifications toast
npm install socket.io socket.io-client  # Real-time updates (WebSockets)
npm install pino pino-pretty       # Logging
npm install jest @testing-library/react # Testing
npm install sentry-nextjs          # Error tracking
npm install --save-dev prisma      # Already have, but ensure updated
```

---

**Généré par Claude Code - 2025-03-01**
