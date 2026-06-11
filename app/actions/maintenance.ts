"use server"

import prisma from '@/lib/prisma'
import { Prisma } from '@/app/generated/prisma'
import { getCurrentUserEmail } from '@/lib/auth'
import { checkRateLimit } from '@/lib/ratelimit'
import { sendWhatsAppMessage, isWhatsAppEnabled, isWhatsAppConfigured } from '@/lib/whatsapp'

/**
 * Active le mode maintenance pour un service ou un poste.
 * Notifie automatiquement les clients en attente via WhatsApp.
 */
export async function activateMaintenanceMode(
  targetId: string,
  targetType: 'service' | 'post',
  reason?: string
): Promise<{ success: boolean; error?: string; maintenanceId?: string }> {
  try {
    const email = await getCurrentUserEmail()
    if (!email) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est OWNER ou ADMIN
    const company = await prisma.company.findUnique({
      where: { email }
    })
    if (!company) {
      return { success: false, error: 'Accès réservé aux OWNER et ADMIN' }
    }

    // Rate limiting
    await checkRateLimit(`maintenance:${email}`, 5, 60)

    // Vérifier que le service/poste appartient à l'entreprise
    let companyId: string
    if (targetType === 'service') {
      const service = await prisma.service.findFirst({
        where: { id: targetId, companyId: company.id }
      })
      if (!service) {
        return { success: false, error: 'Service non trouvé ou accès non autorisé' }
      }
      companyId = service.companyId

      // Vérifier si un mode maintenance existe déjà
      const existing = await prisma.maintenanceMode.findFirst({
        where: { serviceId: targetId, isActive: true }
      })
      if (existing) {
        return { success: false, error: 'Ce service est déjà en maintenance' }
      }
    } else {
      const post = await prisma.post.findFirst({
        where: { id: targetId, companyId: company.id },
        include: { service: true }
      })
      if (!post) {
        return { success: false, error: 'Poste non trouvé ou accès non autorisé' }
      }
      companyId = post.companyId

      // Vérifier si un mode maintenance existe déjà
      const existing = await prisma.maintenanceMode.findFirst({
        where: { postId: targetId, isActive: true }
      })
      if (existing) {
        return { success: false, error: 'Ce poste est déjà en maintenance' }
      }
    }

    // Créer ou réactiver le mode maintenance (serviceId/postId sont uniques :
    // une ligne désactivée peut déjà exister pour cette cible)
    const maintenanceMode = await prisma.maintenanceMode.upsert({
      where: targetType === 'service' ? { serviceId: targetId } : { postId: targetId },
      update: {
        isActive: true,
        reason: reason || 'Indisponibilité temporaire',
        activatedBy: email,
        activatedAt: new Date()
      },
      create: {
        companyId,
        serviceId: targetType === 'service' ? targetId : null,
        postId: targetType === 'post' ? targetId : null,
        reason: reason || 'Indisponibilité temporaire',
        activatedBy: email,
        isActive: true
      }
    })

    // Notifier les clients en attente via WhatsApp
    if (isWhatsAppEnabled() && isWhatsAppConfigured()) {
      await notifyWaitingClients(targetId, targetType, reason || 'Indisponibilité temporaire')
    }

    console.log(`[Maintenance] Mode activé par ${email} pour ${targetType} ${targetId}`)

    return { success: true, maintenanceId: maintenanceMode.id }
  } catch (error) {
    console.error('[Maintenance] Erreur activation:', error)
    const detail = error instanceof Prisma.PrismaClientKnownRequestError ? ` (code ${error.code})` : ''
    return { success: false, error: `Erreur lors de l'activation de la maintenance${detail}` }
  }
}

/**
 * Désactive le mode maintenance pour un service ou un poste.
 */
export async function deactivateMaintenanceMode(maintenanceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await getCurrentUserEmail()
    if (!email) {
      return { success: false, error: 'Non authentifié' }
    }

    // Vérifier que l'utilisateur est OWNER ou ADMIN
    const company = await prisma.company.findUnique({
      where: { email }
    })
    if (!company) {
      return { success: false, error: 'Accès réservé aux OWNER et ADMIN' }
    }

    // Rate limiting
    await checkRateLimit(`maintenance:${email}`, 5, 60)

    // Récupérer le mode maintenance
    const maintenanceMode = await prisma.maintenanceMode.findUnique({
      where: { id: maintenanceId },
      include: { company: true }
    })

    if (!maintenanceMode) {
      return { success: false, error: 'Mode maintenance non trouvé' }
    }

    // Vérifier que l'utilisateur appartient à la bonne entreprise
    if (maintenanceMode.companyId !== company.id) {
      return { success: false, error: 'Accès non autorisé' }
    }

    // Désactiver (soft delete)
    await prisma.maintenanceMode.update({
      where: { id: maintenanceId },
      data: { isActive: false }
    })

    console.log(`[Maintenance] Mode désactivé par ${email} pour ${maintenanceId}`)

    return { success: true }
  } catch (error) {
    console.error('[Maintenance] Erreur désactivation:', error)
    return { success: false, error: 'Erreur lors de la désactivation de la maintenance' }
  }
}

/**
 * Récupère les modes maintenance actifs pour une entreprise.
 */
export async function getActiveMaintenanceModes(companyIdOrEmail: string) {
  try {
    let companyId = companyIdOrEmail
    if (companyIdOrEmail.includes('@')) {
      const company = await prisma.company.findUnique({
        where: { email: companyIdOrEmail },
        select: { id: true }
      })
      if (!company) return []
      companyId = company.id
    }

    const maintenanceModes = await prisma.maintenanceMode.findMany({
      where: {
        companyId,
        isActive: true
      },
      include: {
        service: { select: { id: true, name: true } },
        post: { select: { id: true, name: true, service: { select: { id: true, name: true } } } }
      },
      orderBy: { activatedAt: 'desc' }
    })

    return maintenanceModes
  } catch (error) {
    console.error('[Maintenance] Erreur récupération modes actifs:', error)
    return []
  }
}

/**
 * Vérifie si un service ou un poste est en maintenance.
 * Retourne le mode maintenance si actif, null sinon.
 */
export async function isUnderMaintenance(serviceId?: string, postId?: string) {
  try {
    if (serviceId) {
      const maintenance = await prisma.maintenanceMode.findFirst({
        where: { serviceId, isActive: true }
      })
      return maintenance
    }

    if (postId) {
      const maintenance = await prisma.maintenanceMode.findFirst({
        where: { postId, isActive: true }
      })
      return maintenance
    }

    return null
  } catch (error) {
    console.error('[Maintenance] Erreur vérification maintenance:', error)
    return null
  }
}

/**
 * Notifie les clients en attente via WhatsApp quand un service/poste passe en maintenance.
 */
async function notifyWaitingClients(targetId: string, targetType: 'service' | 'post', reason: string) {
  try {
    let serviceId: string
    let serviceName: string

    if (targetType === 'service') {
      const service = await prisma.service.findUnique({
        where: { id: targetId },
        select: { id: true, name: true }
      })
      if (!service) return
      serviceId = service.id
      serviceName = service.name
    } else {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        include: { service: true }
      })
      if (!post) return
      serviceId = post.service.id
      serviceName = post.service.name
    }

    // Récupérer les tickets PENDING pour ce service avec consentement WhatsApp
    const pendingTickets = await prisma.ticket.findMany({
      where: {
        serviceId,
        status: 'PENDING',
        phoneNumber: { not: null },
        whatsappConsent: true
      },
      select: {
        id: true,
        num: true,
        phoneNumber: true
      },
      take: 50 // Limiter à 50 notifications pour éviter le spam
    })

    // Envoyer les notifications
    for (const ticket of pendingTickets) {
      if (!ticket.phoneNumber) continue

      await sendWhatsAppMessage(
        ticket.phoneNumber,
        'maintenance_suspended',
        {
          ticketNumber: ticket.num,
          serviceName,
          reason
        }
      )

      console.log(`[Maintenance] Notification envoyée pour ticket ${ticket.num}`)
    }
  } catch (error) {
    console.error('[Maintenance] Erreur notification clients:', error)
  }
}
