"use server"

import prisma from '@/lib/prisma'
import { calculateDistance, estimateTravelTime, formatDistance } from '@/lib/geo-utils'

/**
 * Récupère les infos de suivi d'un ticket via son trackingToken.
 * Route publique (pas d'auth requise — le token sert de preuve d'accès).
 */
export async function getTicketTracking(trackingToken: string): Promise<{
  ticket: {
    num: string
    status: string
    serviceName: string
    position: number
    createdAt: string
    isVirtual: boolean
  }
  estimatedWaitMinutes: number
  confidence: string
  company: {
    name: string
    latitude: number | null
    longitude: number | null
  }
  totalPending: number
  distance: {
    meters: number
    formatted: string
    travelMinutes: number
  } | null
} | null> {
  try {
    if (!trackingToken || trackingToken.length < 10) return null

    const ticket = await prisma.ticket.findUnique({
      where: { trackingToken },
      include: {
        service: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    })

    if (!ticket) return null

    // Calculer la position dans la file
    const pendingTickets = await prisma.ticket.findMany({
      where: {
        serviceId: ticket.serviceId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })

    const position = pendingTickets.findIndex(t => t.id === ticket.id) + 1
    const totalPending = pendingTickets.length

    // Estimation ML du temps d'attente
    let estimatedWaitMinutes = 0
    let confidence = 'none'
    try {
      const { getEstimatedWaitTime } = await import('@/lib/wait-time-estimator')
      const estimate = await getEstimatedWaitTime(
        ticket.serviceId,
        ticket.service.companyId,
        position > 0 ? position : 1
      )
      estimatedWaitMinutes = estimate.minutes
      confidence = estimate.confidence
    } catch {
      // Fallback : position × avgTime
      estimatedWaitMinutes = (position > 0 ? position : 1) * ticket.service.avgTime
      confidence = 'none'
    }

    // Distance si les deux positions sont connues
    let distance: { meters: number; formatted: string; travelMinutes: number } | null = null
    if (
      ticket.clientLat &&
      ticket.clientLng &&
      ticket.service.company.latitude &&
      ticket.service.company.longitude
    ) {
      const meters = calculateDistance(
        ticket.clientLat,
        ticket.clientLng,
        ticket.service.company.latitude,
        ticket.service.company.longitude
      )
      distance = {
        meters: Math.round(meters),
        formatted: formatDistance(meters),
        travelMinutes: estimateTravelTime(meters, 'driving'),
      }
    }

    return {
      ticket: {
        num: ticket.num,
        status: ticket.status,
        serviceName: ticket.service.name,
        position: position > 0 ? position : 0,
        createdAt: ticket.createdAt.toISOString(),
        isVirtual: ticket.isVirtual,
      },
      estimatedWaitMinutes,
      confidence,
      company: {
        name: ticket.service.company.name,
        latitude: ticket.service.company.latitude,
        longitude: ticket.service.company.longitude,
      },
      totalPending,
      distance,
    }
  } catch (error) {
    console.error('[Tracking] Erreur getTicketTracking:', error)
    return null
  }
}
