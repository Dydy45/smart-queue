'use server'

import prisma from '@/lib/prisma'
import { feedbackSchema, type FeedbackInput } from '@/lib/validation'
import { verifyStaffAccess } from '@/lib/auth'

/**
 * Soumettre un feedback client pour un ticket terminé.
 * Accessible sans authentification (le client qui a le ticketId peut donner son avis).
 * 
 * Sécurité :
 * - Validation Zod stricte (rating 1-5, commentaire max 500 chars)
 * - Vérification que le ticket existe et est FINISHED
 * - Contrainte unique sur ticketId (un seul feedback par ticket)
 * - Prisma ORM (requêtes paramétrées, pas de SQL injection)
 */
export async function submitFeedback(data: FeedbackInput): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = feedbackSchema.parse(data)

    const ticket = await prisma.ticket.findUnique({
      where: { id: validated.ticketId },
      include: {
        service: { select: { companyId: true } },
        feedback: { select: { id: true } },
      }
    })

    if (!ticket) {
      return { success: false, error: 'Ticket introuvable' }
    }

    if (ticket.status !== 'FINISHED') {
      return { success: false, error: 'Le service n\'est pas encore terminé' }
    }

    if (ticket.feedback) {
      return { success: false, error: 'Un avis a déjà été soumis pour ce ticket' }
    }

    await prisma.feedback.create({
      data: {
        ticketId: validated.ticketId,
        companyId: ticket.service.companyId,
        rating: validated.rating,
        comment: validated.comment || null,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('[submitFeedback] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue lors de l\'envoi du feedback' }
  }
}

/**
 * Récupérer les statistiques de feedback pour une entreprise.
 * Accessible uniquement par OWNER/ADMIN.
 * 
 * Retourne : total, moyenne, distribution par étoiles, tendance 7 jours
 */
export async function getFeedbackStats() {
  try {
    const access = await verifyStaffAccess()

    if (access.role === 'STAFF') {
      throw new Error('Accès refusé')
    }

    const companyId = access.companyId

    // Total et moyenne
    const aggregate = await prisma.feedback.aggregate({
      where: { companyId },
      _count: { id: true },
      _avg: { rating: true },
    })

    // Distribution par étoiles
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    const groups = await prisma.feedback.groupBy({
      by: ['rating'],
      where: { companyId },
      _count: { id: true },
    })

    for (const group of groups) {
      distribution[group.rating] = group._count.id
    }

    // Tendance : 7 derniers jours vs 7 jours précédents
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [currentWeek, previousWeek] = await Promise.all([
      prisma.feedback.aggregate({
        where: {
          companyId,
          createdAt: { gte: sevenDaysAgo },
        },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.feedback.aggregate({
        where: {
          companyId,
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ])

    const currentAvg = currentWeek._avg.rating || 0
    const previousAvg = previousWeek._avg.rating || 0
    const trend = previousAvg > 0
      ? Math.round(((currentAvg - previousAvg) / previousAvg) * 100)
      : 0

    return {
      total: aggregate._count.id,
      average: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0,
      distribution,
      trend,
      currentWeekCount: currentWeek._count.id,
      previousWeekCount: previousWeek._count.id,
    }
  } catch (error) {
    console.error('[getFeedbackStats] Erreur:', error)
    throw error
  }
}

/**
 * Récupérer les feedbacks récents pour une entreprise.
 * Accessible uniquement par OWNER/ADMIN.
 */
export async function getRecentFeedbacks(limit: number = 20) {
  try {
    const access = await verifyStaffAccess()

    if (access.role === 'STAFF') {
      throw new Error('Accès refusé')
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { companyId: access.companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: {
          select: {
            num: true,
            nameComplete: true,
            postName: true,
            service: {
              select: { name: true }
            }
          }
        }
      }
    })

    return feedbacks.map((f) => ({
      id: f.id,
      rating: f.rating,
      comment: f.comment,
      createdAt: f.createdAt.toISOString(),
      ticketNum: f.ticket.num,
      clientName: f.ticket.nameComplete,
      postName: f.ticket.postName,
      serviceName: f.ticket.service.name,
    }))
  } catch (error) {
    console.error('[getRecentFeedbacks] Erreur:', error)
    throw error
  }
}

/**
 * Vérifier si un ticket a déjà reçu un feedback.
 * Accessible sans authentification.
 */
export async function hasTicketFeedback(ticketId: string): Promise<boolean> {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { ticketId },
      select: { id: true }
    })
    return !!feedback
  } catch {
    return false
  }
}
