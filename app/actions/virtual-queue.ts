"use server"

import prisma from '@/lib/prisma'
import { verifyStaffAccess } from '@/lib/auth'
import { isValidCoordinates, calculateDistance, estimateTravelTime } from '@/lib/geo-utils'
import { checkRateLimit, rateLimitConfig, RateLimitError } from '@/lib/ratelimit'

// ===== Configuration entreprise (OWNER/ADMIN) =====

/**
 * Met à jour la localisation GPS de l'entreprise.
 */
export async function updateCompanyLocation(
  latitude: number,
  longitude: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessInfo = await verifyStaffAccess()
    if (accessInfo.role === 'STAFF') {
      return { success: false, error: 'Accès réservé OWNER/ADMIN' }
    }

    if (!isValidCoordinates(latitude, longitude)) {
      return { success: false, error: 'Coordonnées GPS invalides' }
    }

    await prisma.company.update({
      where: { id: accessInfo.companyId },
      data: { latitude, longitude },
    })

    return { success: true }
  } catch (error) {
    console.error('[VirtualQueue] Erreur updateCompanyLocation:', error)
    return { success: false, error: 'Erreur serveur' }
  }
}

/**
 * Active ou désactive la file d'attente virtuelle.
 */
export async function toggleVirtualQueue(
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessInfo = await verifyStaffAccess()
    if (accessInfo.role === 'STAFF') {
      return { success: false, error: 'Accès réservé OWNER/ADMIN' }
    }

    // Si activation, vérifier que la localisation est configurée
    if (enabled) {
      const company = await prisma.company.findUnique({
        where: { id: accessInfo.companyId },
        select: { latitude: true, longitude: true },
      })
      if (!company?.latitude || !company?.longitude) {
        return {
          success: false,
          error: 'Veuillez configurer la localisation de votre entreprise avant d\'activer la file virtuelle',
        }
      }
    }

    await prisma.company.update({
      where: { id: accessInfo.companyId },
      data: { virtualQueueEnabled: enabled },
    })

    return { success: true }
  } catch (error) {
    console.error('[VirtualQueue] Erreur toggleVirtualQueue:', error)
    return { success: false, error: 'Erreur serveur' }
  }
}

/**
 * Met à jour le rayon de proximité (en mètres).
 */
export async function updateProximityRadius(
  radiusMeters: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessInfo = await verifyStaffAccess()
    if (accessInfo.role === 'STAFF') {
      return { success: false, error: 'Accès réservé OWNER/ADMIN' }
    }

    if (radiusMeters < 100 || radiusMeters > 2000) {
      return { success: false, error: 'Le rayon doit être entre 100 et 2000 mètres' }
    }

    await prisma.company.update({
      where: { id: accessInfo.companyId },
      data: { proximityRadius: Math.round(radiusMeters) },
    })

    return { success: true }
  } catch (error) {
    console.error('[VirtualQueue] Erreur updateProximityRadius:', error)
    return { success: false, error: 'Erreur serveur' }
  }
}

/**
 * Récupère la configuration de la file virtuelle.
 */
export async function getVirtualQueueConfig(): Promise<{
  enabled: boolean
  latitude: number | null
  longitude: number | null
  proximityRadius: number
} | null> {
  try {
    const accessInfo = await verifyStaffAccess()

    const company = await prisma.company.findUnique({
      where: { id: accessInfo.companyId },
      select: {
        virtualQueueEnabled: true,
        latitude: true,
        longitude: true,
        proximityRadius: true,
      },
    })

    if (!company) return null

    return {
      enabled: company.virtualQueueEnabled,
      latitude: company.latitude,
      longitude: company.longitude,
      proximityRadius: company.proximityRadius,
    }
  } catch (error) {
    console.error('[VirtualQueue] Erreur getVirtualQueueConfig:', error)
    return null
  }
}

/**
 * Récupère la config file virtuelle pour une page publique (pas d'auth requise).
 */
export async function getVirtualQueuePublicConfig(pageName: string): Promise<{
  enabled: boolean
} | null> {
  try {
    const company = await prisma.company.findUnique({
      where: { pageName },
      select: { virtualQueueEnabled: true },
    })
    if (!company) return null
    return { enabled: company.virtualQueueEnabled }
  } catch (error) {
    console.error('[VirtualQueue] Erreur getVirtualQueuePublicConfig:', error)
    return null
  }
}

// ===== Tracking client (public) =====

/**
 * Met à jour la position GPS du client pour un ticket virtuel.
 */
export async function updateClientLocation(
  trackingToken: string,
  latitude: number,
  longitude: number
): Promise<{
  success: boolean
  distanceMeters?: number
  estimatedTravelMinutes?: number
  error?: string
}> {
  try {
    // Rate limiting: 1 appel / 10s par token
    const { success: rlSuccess } = await checkRateLimit(
      `geo:${trackingToken}`,
      rateLimitConfig.createTicket.limit,
      10_000
    )
    if (!rlSuccess) {
      throw new RateLimitError('Mise à jour trop fréquente. Patientez quelques secondes.')
    }

    if (!isValidCoordinates(latitude, longitude)) {
      return { success: false, error: 'Coordonnées GPS invalides' }
    }

    // Trouver le ticket par trackingToken
    const ticket = await prisma.ticket.findUnique({
      where: { trackingToken },
      select: {
        id: true,
        status: true,
        isVirtual: true,
        service: {
          select: {
            company: {
              select: { latitude: true, longitude: true, proximityRadius: true },
            },
          },
        },
      },
    })

    if (!ticket || !ticket.isVirtual) {
      return { success: false, error: 'Ticket non trouvé ou non virtuel' }
    }

    if (ticket.status === 'FINISHED') {
      return { success: false, error: 'Ticket terminé' }
    }

    // Mettre à jour la position
    await prisma.ticket.update({
      where: { trackingToken },
      data: {
        clientLat: latitude,
        clientLng: longitude,
        locationUpdatedAt: new Date(),
      },
    })

    // Calculer la distance si l'entreprise a une localisation
    const company = ticket.service.company
    let distanceMeters: number | undefined
    let estimatedTravelMinutes: number | undefined

    if (company.latitude && company.longitude) {
      distanceMeters = calculateDistance(
        latitude,
        longitude,
        company.latitude,
        company.longitude
      )
      estimatedTravelMinutes = estimateTravelTime(distanceMeters, 'driving')

      // Vérifier les notifications de proximité et départ
      await checkProximityNotifications(ticket.id, distanceMeters, company.proximityRadius)
    }

    return {
      success: true,
      distanceMeters: distanceMeters ? Math.round(distanceMeters) : undefined,
      estimatedTravelMinutes,
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message }
    }
    console.error('[VirtualQueue] Erreur updateClientLocation:', error)
    return { success: false, error: 'Erreur serveur' }
  }
}

/**
 * Vérifie et envoie les notifications de proximité / arrivée.
 */
async function checkProximityNotifications(
  ticketId: string,
  distanceMeters: number,
  proximityRadius: number
): Promise<void> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        num: true,
        phoneNumber: true,
        whatsappConsent: true,
        arrivalNotified: true,
        departureNotified: true,
        status: true,
        serviceId: true,
        service: {
          select: { name: true, companyId: true },
        },
      },
    })

    if (!ticket || !ticket.phoneNumber || !ticket.whatsappConsent) return

    // Notification "Vous êtes arrivé" — client dans le rayon de proximité
    if (distanceMeters <= proximityRadius && !ticket.arrivalNotified) {
      try {
        const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
        await sendWhatsAppMessage(ticket.phoneNumber, 'virtual_arrived' as never, {
          ticketNumber: ticket.num,
          serviceName: ticket.service.name,
        })
      } catch {
        // Notification non-bloquante
      }

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { arrivalNotified: true },
      })
    }
  } catch (error) {
    console.error('[VirtualQueue] Erreur checkProximityNotifications:', error)
  }
}

/**
 * Vérifie si un client virtuel doit partir maintenant.
 * Appelé quand la file change (ticket appelé ou terminé).
 */
export async function checkDepartureNotifications(serviceId: string): Promise<void> {
  try {
    // Récupérer tous les tickets virtuels PENDING non-notifiés pour ce service
    const virtualTickets = await prisma.ticket.findMany({
      where: {
        serviceId,
        isVirtual: true,
        status: 'PENDING',
        departureNotified: false,
        clientLat: { not: null },
        clientLng: { not: null },
        phoneNumber: { not: null },
        whatsappConsent: true,
      },
      include: {
        service: {
          select: {
            name: true,
            companyId: true,
            company: {
              select: { latitude: true, longitude: true, name: true, pageName: true },
            },
          },
        },
      },
    })

    if (virtualTickets.length === 0) return

    const { getEstimatedWaitTime } = await import('@/lib/wait-time-estimator')

    // Compter les tickets PENDING devant chaque ticket virtuel
    const allPending = await prisma.ticket.findMany({
      where: { serviceId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    for (const ticket of virtualTickets) {
      if (!ticket.clientLat || !ticket.clientLng) continue
      if (!ticket.service.company.latitude || !ticket.service.company.longitude) continue

      // Position dans la file
      const position = allPending.findIndex(t => t.id === ticket.id) + 1
      if (position <= 0) continue

      // Estimation du temps d'attente ML
      let estimatedWaitMinutes: number
      try {
        const estimate = await getEstimatedWaitTime(
          serviceId,
          ticket.service.companyId,
          position
        )
        estimatedWaitMinutes = estimate.minutes
      } catch {
        continue // Pas d'estimation = pas de notification
      }

      // Temps de trajet estimé
      const distanceMeters = calculateDistance(
        ticket.clientLat,
        ticket.clientLng,
        ticket.service.company.latitude,
        ticket.service.company.longitude
      )
      const travelMinutes = estimateTravelTime(distanceMeters, 'driving')

      // Notifier si temps d'attente ≈ temps de trajet (±5 min de marge)
      const DEPARTURE_MARGIN = 5
      if (estimatedWaitMinutes <= travelMinutes + DEPARTURE_MARGIN) {
        try {
          const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
          await sendWhatsAppMessage(ticket.phoneNumber!, 'virtual_depart' as never, {
            ticketNumber: ticket.num,
            serviceName: ticket.service.name,
            estimatedTime: estimatedWaitMinutes,
          })
        } catch {
          // Notification non-bloquante
        }

        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { departureNotified: true },
        })
      }
    }
  } catch (error) {
    console.error('[VirtualQueue] Erreur checkDepartureNotifications:', error)
  }
}

/**
 * Nettoie les données GPS d'un ticket terminé (RGPD).
 */
export async function cleanupGeoData(ticketId: string): Promise<void> {
  try {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        clientLat: null,
        clientLng: null,
        locationUpdatedAt: null,
      },
    })
  } catch (error) {
    console.error('[VirtualQueue] Erreur cleanupGeoData:', error)
  }
}
