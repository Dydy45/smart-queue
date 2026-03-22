"use server"

import prisma from '@/lib/prisma'
import {
  sendWhatsAppMessage,
  getNotificationThreshold,
  isWhatsAppEnabled,
  isWhatsAppConfigured,
} from '@/lib/whatsapp'

/**
 * Vérifie les tickets proches d'être appelés pour un service donné
 * et envoie une notification WhatsApp si nécessaire.
 * 
 * Appelé automatiquement quand un ticket change de statut (PROCESSING ou FINISHED).
 */
export async function checkAndNotifyUpcomingTickets(serviceId: string) {
  if (!isWhatsAppEnabled() || !isWhatsAppConfigured()) {
    return
  }

  try {
    const threshold = getNotificationThreshold()

    // Récupérer le service avec son nom et avgTime
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { name: true, avgTime: true },
    })

    if (!service) {
      console.warn(`[WhatsApp] Service ${serviceId} non trouvé`)
      return
    }

    // Récupérer tous les tickets PENDING pour ce service, ordonnés par date de création
    const pendingTickets = await prisma.ticket.findMany({
      where: {
        serviceId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    })

    // Pour chaque ticket dans les `threshold` premiers,
    // envoyer une notification s'il a un numéro WhatsApp et n'a pas encore été notifié
    const ticketsToNotify = pendingTickets.slice(0, threshold)

    for (const ticket of ticketsToNotify) {
      if (
        ticket.phoneNumber &&
        ticket.whatsappConsent &&
        !ticket.whatsappNotified
      ) {
        const position = pendingTickets.findIndex((t) => t.id === ticket.id) + 1
        // Utiliser l'estimation ML si possible, sinon fallback vers position × avgTime
        let estimatedTime = position * service.avgTime
        try {
          const { getEstimatedWaitTime } = await import('@/lib/wait-time-estimator')
          const serviceRecord = await prisma.service.findUnique({ where: { id: serviceId }, select: { companyId: true } })
          if (serviceRecord) {
            const mlEstimate = await getEstimatedWaitTime(serviceId, serviceRecord.companyId, position)
            if (mlEstimate.confidence !== 'none') {
              estimatedTime = mlEstimate.minutes
            }
          }
        } catch {
          // Fallback silencieux vers le calcul statique
        }

        const result = await sendWhatsAppMessage(
          ticket.phoneNumber,
          'ticket_approaching',
          {
            ticketNumber: ticket.num,
            serviceName: service.name,
            estimatedTime,
          }
        )

        if (result.success) {
          // Marquer le ticket comme notifié et stocker le messageId
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              whatsappNotified: true,
              whatsappMessageId: result.messageId,
            },
          })

          console.log(
            `[WhatsApp] ✅ Notification envoyée pour ticket ${ticket.num} (position ${position})`
          )
        } else {
          console.warn(
            `[WhatsApp] ⚠️ Échec notification pour ticket ${ticket.num}: ${result.error}`
          )
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp] Erreur dans checkAndNotifyUpcomingTickets:', error)
  }
}

/**
 * Envoie une notification "ticket appelé" quand un ticket passe en CALL.
 * Utilise le template `ticket_called`.
 */
export async function notifyTicketCalled(ticketId: string) {
  if (!isWhatsAppEnabled() || !isWhatsAppConfigured()) {
    return
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { service: true },
    })

    if (!ticket || !ticket.phoneNumber || !ticket.whatsappConsent) {
      return
    }

    const result = await sendWhatsAppMessage(
      ticket.phoneNumber,
      'ticket_called',
      {
        ticketNumber: ticket.num,
        postName: ticket.postName || undefined,
      }
    )

    if (result.success) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          whatsappNotified: true,
          whatsappMessageId: result.messageId,
        },
      })

      console.log(`[WhatsApp] ✅ Ticket ${ticket.num} appelé - notification envoyée`)
    }
  } catch (error) {
    console.error('[WhatsApp] Erreur dans notifyTicketCalled:', error)
  }
}
