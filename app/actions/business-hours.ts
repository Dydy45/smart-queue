'use server'

import prisma from '@/lib/prisma'
import { verifyStaffAccess } from '@/lib/auth'
import { businessHoursSchema, closedDateSchema } from '@/lib/validation'
import type { BusinessHoursInput, ClosedDateInput } from '@/lib/validation'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * Récupère les horaires d'ouverture d'une entreprise.
 * Route publique (nécessaire pour la page de prise de RDV).
 */
export async function getBusinessHoursByPageName(pageName: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { pageName },
      select: { id: true }
    })
    if (!company) return null

    const hours = await prisma.businessHours.findMany({
      where: { companyId: company.id },
      orderBy: { dayOfWeek: 'asc' }
    })

    // Retourner les 7 jours (avec défauts pour jours non configurés)
    return DAY_NAMES.map((name, index) => {
      const existing = hours.find((h: { dayOfWeek: number }) => h.dayOfWeek === index)
      return {
        dayOfWeek: index,
        dayName: name,
        openTime: existing?.openTime || '09:00',
        closeTime: existing?.closeTime || '18:00',
        isOpen: existing?.isOpen ?? (index >= 1 && index <= 5), // Lun-Ven ouvert par défaut
        isConfigured: !!existing,
      }
    })
  } catch (error) {
    console.error('[getBusinessHoursByPageName] Erreur:', error)
    return null
  }
}

/**
 * Récupère les horaires d'ouverture pour OWNER/ADMIN (via auth).
 */
export async function getBusinessHours() {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      throw new Error('Accès réservé aux OWNER/ADMIN')
    }

    const hours = await prisma.businessHours.findMany({
      where: { companyId: access.companyId },
      orderBy: { dayOfWeek: 'asc' }
    })

    return DAY_NAMES.map((name, index) => {
      const existing = hours.find((h: { dayOfWeek: number }) => h.dayOfWeek === index)
      return {
        dayOfWeek: index,
        dayName: name,
        openTime: existing?.openTime || '09:00',
        closeTime: existing?.closeTime || '18:00',
        isOpen: existing?.isOpen ?? (index >= 1 && index <= 5),
        isConfigured: !!existing,
      }
    })
  } catch (error) {
    console.error('[getBusinessHours] Erreur:', error)
    throw error
  }
}

/**
 * Met à jour les horaires d'un jour de la semaine (OWNER/ADMIN).
 * Upsert : crée ou met à jour l'entrée.
 */
export async function setBusinessHours(
  data: BusinessHoursInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const validated = businessHoursSchema.parse(data)

    // Vérifier cohérence des horaires
    if (validated.isOpen && validated.openTime >= validated.closeTime) {
      return { success: false, error: 'L\'heure d\'ouverture doit être avant l\'heure de fermeture' }
    }

    await prisma.businessHours.upsert({
      where: {
        companyId_dayOfWeek: {
          companyId: access.companyId,
          dayOfWeek: validated.dayOfWeek,
        }
      },
      update: {
        openTime: validated.openTime,
        closeTime: validated.closeTime,
        isOpen: validated.isOpen,
      },
      create: {
        companyId: access.companyId,
        dayOfWeek: validated.dayOfWeek,
        openTime: validated.openTime,
        closeTime: validated.closeTime,
        isOpen: validated.isOpen,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('[setBusinessHours] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Enregistre tous les horaires de la semaine d'un coup (OWNER/ADMIN).
 */
export async function setAllBusinessHours(
  hours: BusinessHoursInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    // Valider tous les horaires
    for (const h of hours) {
      const validated = businessHoursSchema.parse(h)
      if (validated.isOpen && validated.openTime >= validated.closeTime) {
        return {
          success: false,
          error: `${DAY_NAMES[validated.dayOfWeek]} : l'heure d'ouverture doit être avant l'heure de fermeture`
        }
      }
    }

    // Upsert chaque jour dans une transaction
    await prisma.$transaction(
      hours.map(h =>
        prisma.businessHours.upsert({
          where: {
            companyId_dayOfWeek: {
              companyId: access.companyId,
              dayOfWeek: h.dayOfWeek,
            }
          },
          update: {
            openTime: h.openTime,
            closeTime: h.closeTime,
            isOpen: h.isOpen,
          },
          create: {
            companyId: access.companyId,
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime,
            closeTime: h.closeTime,
            isOpen: h.isOpen,
          }
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error('[setAllBusinessHours] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupère les dates de fermeture exceptionnelle (OWNER/ADMIN).
 */
export async function getClosedDates() {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      throw new Error('Accès réservé aux OWNER/ADMIN')
    }

    const dates = await prisma.closedDate.findMany({
      where: { companyId: access.companyId },
      orderBy: { date: 'asc' }
    })

    return dates.map((d: { id: string; date: Date; reason: string | null }) => ({
      id: d.id,
      date: d.date.toISOString().split('T')[0],
      reason: d.reason,
    }))
  } catch (error) {
    console.error('[getClosedDates] Erreur:', error)
    throw error
  }
}

/**
 * Ajoute une date de fermeture exceptionnelle (OWNER/ADMIN).
 * Annule automatiquement les RDV existants ce jour-là.
 */
export async function addClosedDate(
  data: ClosedDateInput
): Promise<{ success: boolean; cancelledCount?: number; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const validated = closedDateSchema.parse(data)
    const dateObj = new Date(validated.date + 'T00:00:00')

    // Vérifier que la date est dans le futur
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dateObj < today) {
      return { success: false, error: 'La date doit être dans le futur' }
    }

    // Vérifier que la date n'est pas déjà ajoutée
    const existing = await prisma.closedDate.findFirst({
      where: { companyId: access.companyId, date: dateObj }
    })
    if (existing) {
      return { success: false, error: 'Cette date est déjà marquée comme fermée' }
    }

    // Créer la fermeture
    await prisma.closedDate.create({
      data: {
        companyId: access.companyId,
        date: dateObj,
        reason: validated.reason || null,
      }
    })

    // Annuler les RDV existants ce jour-là
    const dayStart = new Date(dateObj)
    const dayEnd = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000)

    const result = await prisma.appointment.updateMany({
      where: {
        companyId: access.companyId,
        appointmentDate: { gte: dayStart, lt: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: `Fermeture exceptionnelle${validated.reason ? ' : ' + validated.reason : ''}`,
      }
    })

    return { success: true, cancelledCount: result.count }
  } catch (error) {
    console.error('[addClosedDate] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime une date de fermeture exceptionnelle (OWNER/ADMIN).
 */
export async function removeClosedDate(
  closedDateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const closedDate = await prisma.closedDate.findUnique({
      where: { id: closedDateId },
      select: { companyId: true }
    })

    if (!closedDate || closedDate.companyId !== access.companyId) {
      return { success: false, error: 'Date non trouvée' }
    }

    await prisma.closedDate.delete({ where: { id: closedDateId } })

    return { success: true }
  } catch (error) {
    console.error('[removeClosedDate] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
