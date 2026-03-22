import prisma from '@/lib/prisma'

/**
 * Niveaux de confiance de l'estimation
 * - none: aucune donnée historique, fallback vers avgTime
 * - low: 1-9 tickets, moyenne simple
 * - medium: 10-49 tickets, EWMA sans contexte horaire
 * - high: 50+ tickets, EWMA complet avec contexte horaire/jour
 */
export type ConfidenceLevel = 'none' | 'low' | 'medium' | 'high'

export interface ServiceDurationEstimate {
  estimate: number         // durée estimée en minutes
  confidence: ConfidenceLevel
  sampleSize: number       // nombre de tickets utilisés
}

export interface WaitTimeEstimate {
  minutes: number
  confidence: ConfidenceLevel
  breakdown: {
    serviceDuration: number  // durée estimée du service (min)
    activePostsCount: number // nombre de postes actifs
    queuePosition: number
  }
}

export interface EstimationAccuracy {
  meanAbsoluteError: number  // erreur moyenne absolue en minutes
  meanRelativeError: number  // erreur relative moyenne (0-1)
  accuracy: number           // 1 - meanRelativeError (0-1)
  sampleSize: number
}

export interface ServiceEstimationStats {
  serviceId: string
  serviceName: string
  configuredAvgTime: number
  actualAvgDuration: number
  estimatedDuration: number
  accuracy: EstimationAccuracy
  confidence: ConfidenceLevel
  sampleSize: number
  peakHours: number[]
}

// ─── Constantes ───────────────────────────────────────────────

const EWMA_ALPHA = 0.7                // poids des données récentes
const RECENT_WINDOW = 50              // nombre de tickets récents pour l'EWMA
const HISTORICAL_DAYS = 30            // jours d'historique à considérer
const MIN_SAMPLES_LOW = 1
const MIN_SAMPLES_MEDIUM = 10
const MIN_SAMPLES_HIGH = 50
const PEAK_HOUR_THRESHOLD = 1.3       // 30% au-dessus de la moyenne = heure de pointe
const LARGE_QUEUE_THRESHOLD = 10      // file longue → marge supplémentaire
const LARGE_QUEUE_MARGIN = 0.10       // +10% pour les grandes files
const PEAK_HOUR_MARGIN = 0.15         // +15% pendant les heures de pointe

// ─── Fonctions principales ────────────────────────────────────

/**
 * Calcule la durée estimée de traitement pour un service donné
 * en utilisant l'algorithme EWMA (Exponentially Weighted Moving Average)
 * avec fallback progressif selon la quantité de données disponibles.
 */
export async function getEstimatedServiceDuration(
  serviceId: string,
  companyId: string
): Promise<ServiceDurationEstimate> {
  const finishedTickets = await getFinishedTicketsForService(serviceId, companyId)

  if (finishedTickets.length === 0) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { avgTime: true }
    })
    return {
      estimate: service?.avgTime ?? 15,
      confidence: 'none',
      sampleSize: 0
    }
  }

  const durations = finishedTickets
    .map(t => getTicketServiceDuration(t))
    .filter((d): d is number => d !== null && d > 0 && d < 480) // exclure les aberrations > 8h

  if (durations.length === 0) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { avgTime: true }
    })
    return {
      estimate: service?.avgTime ?? 15,
      confidence: 'none',
      sampleSize: 0
    }
  }

  // Fallback progressif selon le nombre d'échantillons
  if (durations.length < MIN_SAMPLES_MEDIUM) {
    // < 10 tickets : moyenne simple
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    return {
      estimate: Math.round(avg),
      confidence: 'low',
      sampleSize: durations.length
    }
  }

  if (durations.length < MIN_SAMPLES_HIGH) {
    // 10-49 tickets : EWMA simple (sans contexte horaire)
    const ewma = computeEWMA(durations)
    return {
      estimate: Math.round(ewma),
      confidence: 'medium',
      sampleSize: durations.length
    }
  }

  // 50+ tickets : EWMA complet avec contexte horaire
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay()

  // Filtrer les tickets de la même plage horaire (±1h) et même jour de semaine
  const contextualDurations = finishedTickets
    .filter(t => {
      if (!t.calledAt) return false
      const ticketHour = new Date(t.calledAt).getHours()
      const ticketDay = new Date(t.calledAt).getDay()
      return Math.abs(ticketHour - currentHour) <= 1 && ticketDay === currentDay
    })
    .map(t => getTicketServiceDuration(t))
    .filter((d): d is number => d !== null && d > 0 && d < 480)

  // EWMA récent (tous les tickets)
  const recentEWMA = computeEWMA(durations.slice(-RECENT_WINDOW))

  // Si on a assez de données contextuelles, faire un mix
  if (contextualDurations.length >= 5) {
    const contextualAvg = contextualDurations.reduce((a, b) => a + b, 0) / contextualDurations.length
    const blended = EWMA_ALPHA * recentEWMA + (1 - EWMA_ALPHA) * contextualAvg
    return {
      estimate: Math.round(blended),
      confidence: 'high',
      sampleSize: durations.length
    }
  }

  return {
    estimate: Math.round(recentEWMA),
    confidence: 'high',
    sampleSize: durations.length
  }
}

/**
 * Calcule le temps d'attente estimé pour un ticket à une position donnée dans la file.
 * Prend en compte le nombre de postes actifs et les facteurs contextuels.
 */
export async function getEstimatedWaitTime(
  serviceId: string,
  companyId: string,
  queuePosition: number
): Promise<WaitTimeEstimate> {
  if (queuePosition <= 0) {
    return {
      minutes: 0,
      confidence: 'high',
      breakdown: { serviceDuration: 0, activePostsCount: 1, queuePosition: 0 }
    }
  }

  const durationEstimate = await getEstimatedServiceDuration(serviceId, companyId)
  const activePostsCount = await getActivePostsCount(companyId, serviceId)
  const effectivePosts = Math.max(activePostsCount, 1)

  let waitMinutes = (queuePosition / effectivePosts) * durationEstimate.estimate

  // Ajustements contextuels
  if (queuePosition > LARGE_QUEUE_THRESHOLD) {
    waitMinutes *= (1 + LARGE_QUEUE_MARGIN)
  }

  if (durationEstimate.confidence === 'high') {
    const isPeak = await isCurrentlyPeakHour(serviceId, companyId)
    if (isPeak) {
      waitMinutes *= (1 + PEAK_HOUR_MARGIN)
    }
  }

  return {
    minutes: Math.round(waitMinutes),
    confidence: durationEstimate.confidence,
    breakdown: {
      serviceDuration: durationEstimate.estimate,
      activePostsCount: effectivePosts,
      queuePosition
    }
  }
}

/**
 * Calcule la précision du modèle d'estimation sur les N derniers jours.
 * Compare les estimations qu'on aurait données vs les durées réelles.
 */
export async function getEstimationAccuracy(
  serviceId: string,
  companyId: string,
  days: number = 7
): Promise<EstimationAccuracy> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const tickets = await prisma.ticket.findMany({
    where: {
      serviceId,
      service: { companyId },
      status: 'FINISHED',
      calledAt: { not: null },
      finishedAt: { not: null, gte: since }
    },
    orderBy: { finishedAt: 'asc' },
    select: { calledAt: true, startedAt: true, finishedAt: true },
    take: 200
  })

  if (tickets.length === 0) {
    return { meanAbsoluteError: 0, meanRelativeError: 0, accuracy: 0, sampleSize: 0 }
  }

  const durations = tickets
    .map(t => {
      const start = t.calledAt ? new Date(t.calledAt).getTime() : null
      const end = t.finishedAt ? new Date(t.finishedAt).getTime() : null
      if (!start || !end) return null
      return (end - start) / 60000
    })
    .filter((d): d is number => d !== null && d > 0 && d < 480)

  if (durations.length < 2) {
    return { meanAbsoluteError: 0, meanRelativeError: 0, accuracy: 0, sampleSize: durations.length }
  }

  // Simuler : pour chaque ticket, estimer sa durée avec les tickets précédents
  let totalAbsError = 0
  let totalRelError = 0
  let validCount = 0

  for (let i = 1; i < durations.length; i++) {
    const previousDurations = durations.slice(Math.max(0, i - RECENT_WINDOW), i)
    const estimated = previousDurations.length > 0
      ? computeEWMA(previousDurations)
      : durations[0]
    const actual = durations[i]
    const absError = Math.abs(estimated - actual)
    const relError = actual > 0 ? absError / actual : 0

    totalAbsError += absError
    totalRelError += relError
    validCount++
  }

  const meanAbsoluteError = validCount > 0 ? Math.round(totalAbsError / validCount * 10) / 10 : 0
  const meanRelativeError = validCount > 0 ? Math.round(totalRelError / validCount * 100) / 100 : 0

  return {
    meanAbsoluteError,
    meanRelativeError,
    accuracy: Math.round((1 - Math.min(meanRelativeError, 1)) * 100) / 100,
    sampleSize: validCount
  }
}

/**
 * Détecte les heures de pointe pour un service donné
 * en analysant la distribution horaire des tickets historiques.
 */
export async function detectPeakHours(
  serviceId: string,
  companyId: string
): Promise<number[]> {
  const since = new Date()
  since.setDate(since.getDate() - HISTORICAL_DAYS)

  const tickets = await prisma.ticket.findMany({
    where: {
      serviceId,
      service: { companyId },
      status: 'FINISHED',
      calledAt: { not: null },
      finishedAt: { not: null, gte: since }
    },
    select: { createdAt: true },
    take: 500
  })

  if (tickets.length < 20) return []

  // Compter les tickets par heure
  const hourCounts = new Array(24).fill(0)
  for (const t of tickets) {
    hourCounts[new Date(t.createdAt).getHours()]++
  }

  // Moyenne par heure (en excluant les heures sans tickets)
  const activeHours = hourCounts.filter(c => c > 0)
  if (activeHours.length === 0) return []
  const avgCount = activeHours.reduce((a, b) => a + b, 0) / activeHours.length

  // Les heures avec 30%+ de tickets au-dessus de la moyenne sont des heures de pointe
  const peakHours: number[] = []
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > avgCount * PEAK_HOUR_THRESHOLD) {
      peakHours.push(h)
    }
  }

  return peakHours
}

// ─── Fonctions utilitaires privées ────────────────────────────

/**
 * Récupère les tickets FINISHED récents pour un service donné,
 * avec les timestamps nécessaires au calcul de durée.
 */
async function getFinishedTicketsForService(serviceId: string, companyId: string) {
  const since = new Date()
  since.setDate(since.getDate() - HISTORICAL_DAYS)

  return prisma.ticket.findMany({
    where: {
      serviceId,
      service: { companyId },
      status: 'FINISHED',
      finishedAt: { not: null, gte: since }
    },
    orderBy: { finishedAt: 'desc' },
    select: {
      calledAt: true,
      startedAt: true,
      finishedAt: true
    },
    take: RECENT_WINDOW * 2
  })
}

/**
 * Calcule la durée de traitement d'un ticket en minutes.
 * Priorité : startedAt→finishedAt (traitement pur), sinon calledAt→finishedAt (inclut attente au poste).
 */
function getTicketServiceDuration(ticket: {
  calledAt: Date | null
  startedAt: Date | null
  finishedAt: Date | null
}): number | null {
  if (!ticket.finishedAt) return null

  const end = new Date(ticket.finishedAt).getTime()

  // Priorité à startedAt (durée de traitement pure)
  if (ticket.startedAt) {
    return (end - new Date(ticket.startedAt).getTime()) / 60000
  }

  // Fallback sur calledAt (inclut le temps d'attente au poste)
  if (ticket.calledAt) {
    return (end - new Date(ticket.calledAt).getTime()) / 60000
  }

  return null
}

/**
 * Calcule l'EWMA (Exponentially Weighted Moving Average) sur un tableau de durées.
 * Les éléments les plus récents ont plus de poids.
 */
function computeEWMA(values: number[]): number {
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]

  let ewma = values[0]
  for (let i = 1; i < values.length; i++) {
    ewma = EWMA_ALPHA * values[i] + (1 - EWMA_ALPHA) * ewma
  }
  return ewma
}

/**
 * Compte le nombre de postes actuellement actifs (avec un ticket IN_PROGRESS)
 * pour un service donné dans une entreprise.
 */
async function getActivePostsCount(companyId: string, serviceId: string): Promise<number> {
  const count = await prisma.ticket.count({
    where: {
      status: 'IN_PROGRESS',
      service: { companyId, id: serviceId }
    }
  })
  return count
}

/**
 * Vérifie si l'heure actuelle est une heure de pointe pour ce service.
 */
async function isCurrentlyPeakHour(serviceId: string, companyId: string): Promise<boolean> {
  const peakHours = await detectPeakHours(serviceId, companyId)
  return peakHours.includes(new Date().getHours())
}
