'use server'

import prisma from '@/lib/prisma'
import { verifyStaffAccess } from '@/lib/auth'
import {
  getEstimatedWaitTime,
  getEstimatedServiceDuration,
  getEstimationAccuracy,
  detectPeakHours,
  type ServiceEstimationStats
} from '@/lib/wait-time-estimator'

/**
 * Estimation publique du temps d'attente pour un service donné.
 * Utilisable côté client (page /page/{pageName}) sans authentification.
 */
export async function getPublicWaitTimeEstimation(
  pageName: string,
  serviceId: string,
  queuePosition: number
): Promise<{ minutes: number; confidence: string } | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { pageName },
      select: { id: true }
    })

    if (!company) return null

    // Vérifier que le service appartient bien à cette entreprise
    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: company.id }
    })

    if (!service) return null

    const estimate = await getEstimatedWaitTime(serviceId, company.id, queuePosition)

    return {
      minutes: estimate.minutes,
      confidence: estimate.confidence
    }
  } catch (error) {
    console.error('[Estimation] Erreur getPublicWaitTimeEstimation:', error)
    return null
  }
}

/**
 * Dashboard d'estimation complet pour OWNER/ADMIN.
 * Retourne les stats d'estimation pour chaque service de l'entreprise.
 */
export async function getEstimationDashboard(): Promise<{
  services: ServiceEstimationStats[]
  globalAccuracy: number
  totalSampleSize: number
} | null> {
  try {
    const accessInfo = await verifyStaffAccess()

    if (accessInfo.role !== 'OWNER' && accessInfo.role !== 'ADMIN') {
      throw new Error('Accès réservé aux OWNER et ADMIN')
    }

    const services = await prisma.service.findMany({
      where: { companyId: accessInfo.companyId },
      select: { id: true, name: true, avgTime: true }
    })

    const stats: ServiceEstimationStats[] = []

    for (const service of services) {
      const duration = await getEstimatedServiceDuration(service.id, accessInfo.companyId)
      const accuracy = await getEstimationAccuracy(service.id, accessInfo.companyId, 30)
      const peakHours = await detectPeakHours(service.id, accessInfo.companyId)

      // Calculer la durée moyenne réelle (si données disponibles)
      const finishedTickets = await prisma.ticket.findMany({
        where: {
          serviceId: service.id,
          status: 'FINISHED',
          calledAt: { not: null },
          finishedAt: { not: null }
        },
        select: { calledAt: true, finishedAt: true },
        take: 200,
        orderBy: { finishedAt: 'desc' }
      })

      const realDurations = finishedTickets
        .map(t => {
          if (!t.calledAt || !t.finishedAt) return null
          return (new Date(t.finishedAt).getTime() - new Date(t.calledAt).getTime()) / 60000
        })
        .filter((d): d is number => d !== null && d > 0 && d < 480)

      const actualAvgDuration = realDurations.length > 0
        ? Math.round(realDurations.reduce((a, b) => a + b, 0) / realDurations.length * 10) / 10
        : 0

      stats.push({
        serviceId: service.id,
        serviceName: service.name,
        configuredAvgTime: service.avgTime,
        actualAvgDuration,
        estimatedDuration: duration.estimate,
        accuracy,
        confidence: duration.confidence,
        sampleSize: duration.sampleSize,
        peakHours
      })
    }

    // Calcul de la précision globale (moyenne pondérée par sampleSize)
    const totalSamples = stats.reduce((acc, s) => acc + s.accuracy.sampleSize, 0)
    const globalAccuracy = totalSamples > 0
      ? Math.round(
          stats.reduce((acc, s) => acc + s.accuracy.accuracy * s.accuracy.sampleSize, 0)
          / totalSamples * 100
        ) / 100
      : 0

    return {
      services: stats,
      globalAccuracy,
      totalSampleSize: totalSamples
    }
  } catch (error) {
    console.error('[Estimation] Erreur getEstimationDashboard:', error)
    return null
  }
}

/**
 * Synchronise le avgTime d'un service avec la durée réelle mesurée.
 * Réservé OWNER/ADMIN.
 */
export async function syncAvgTimeWithHistory(
  serviceId: string
): Promise<{ success: boolean; oldAvgTime: number; newAvgTime: number; error?: string }> {
  try {
    const accessInfo = await verifyStaffAccess()

    if (accessInfo.role !== 'OWNER' && accessInfo.role !== 'ADMIN') {
      return { success: false, oldAvgTime: 0, newAvgTime: 0, error: 'Accès réservé aux OWNER et ADMIN' }
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId: accessInfo.companyId },
      select: { id: true, avgTime: true }
    })

    if (!service) {
      return { success: false, oldAvgTime: 0, newAvgTime: 0, error: 'Service non trouvé' }
    }

    const duration = await getEstimatedServiceDuration(serviceId, accessInfo.companyId)

    if (duration.confidence === 'none') {
      return {
        success: false,
        oldAvgTime: service.avgTime,
        newAvgTime: service.avgTime,
        error: 'Pas assez de données historiques pour synchroniser'
      }
    }

    const newAvgTime = Math.max(1, Math.round(duration.estimate))

    await prisma.service.update({
      where: { id: serviceId },
      data: { avgTime: newAvgTime }
    })

    return {
      success: true,
      oldAvgTime: service.avgTime,
      newAvgTime
    }
  } catch (error) {
    console.error('[Estimation] Erreur syncAvgTimeWithHistory:', error)
    return { success: false, oldAvgTime: 0, newAvgTime: 0, error: 'Erreur interne' }
  }
}

/**
 * Récupère les estimations ML pour un ensemble de tickets PENDING.
 * Utilisé pour enrichir les tickets côté serveur avant de les envoyer au client.
 */
export async function getEstimationsForPendingTickets(
  companyId: string,
  tickets: Array<{ id: string; serviceId: string }>
): Promise<Map<string, { estimatedWait: number; confidence: string }>> {
  const estimations = new Map<string, { estimatedWait: number; confidence: string }>()

  // Grouper les tickets par service pour optimiser les appels
  const ticketsByService = new Map<string, Array<{ id: string; position: number }>>()

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i]
    if (!ticketsByService.has(ticket.serviceId)) {
      ticketsByService.set(ticket.serviceId, [])
    }
    ticketsByService.get(ticket.serviceId)!.push({ id: ticket.id, position: i + 1 })
  }

  // Pour chaque service, calculer les estimations
  for (const [serviceId, serviceTickets] of ticketsByService) {
    for (const t of serviceTickets) {
      try {
        const estimate = await getEstimatedWaitTime(serviceId, companyId, t.position)
        estimations.set(t.id, {
          estimatedWait: estimate.minutes,
          confidence: estimate.confidence
        })
      } catch {
        // En cas d'erreur, on ne met pas d'estimation
      }
    }
  }

  return estimations
}
