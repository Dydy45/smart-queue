'use server'

import prisma from '@/lib/prisma'
import { verifyStaffAccess } from '@/lib/auth'
import { checkRateLimit, RateLimitError } from '@/lib/ratelimit'
import { appointmentSchema, type AppointmentInput } from '@/lib/validation'
import { pageNameSchema } from '@/lib/validation'
import { generateTicketNumber } from '@/app/actions'

/**
 * Crée un nouveau rendez-vous.
 * Route publique (pas d'authentification requise — les clients prennent RDV).
 * Sécurité : validation Zod, vérification des créneaux, rate limiting par IP/page.
 */
export async function createAppointment(
  pageName: string,
  data: AppointmentInput
): Promise<{ success: boolean; appointmentId?: string; cancelToken?: string; error?: string }> {
  try {
    const validatedPageName = pageNameSchema.parse(pageName)

    // Rate limiting : 5 RDV par minute par page
    const { success: rlOk } = await checkRateLimit(
      `appointment:${validatedPageName}`,
      5,
      60 * 1000
    )
    if (!rlOk) {
      return { success: false, error: 'Trop de réservations. Veuillez réessayer dans une minute.' }
    }

    const validated = appointmentSchema.parse(data)

    // Vérifier que l'entreprise existe
    const company = await prisma.company.findUnique({
      where: { pageName: validatedPageName },
      select: { id: true }
    })
    if (!company) {
      return { success: false, error: 'Entreprise introuvable' }
    }

    // Vérifier que le service appartient à l'entreprise
    const service = await prisma.service.findUnique({
      where: { id: validated.serviceId },
      select: { id: true, companyId: true, avgTime: true }
    })
    if (!service || service.companyId !== company.id) {
      return { success: false, error: 'Service invalide' }
    }

    const appointmentDate = new Date(validated.appointmentDate)
    const now = new Date()

    // Vérifier que la date est dans le futur (au moins 1h)
    if (appointmentDate.getTime() < now.getTime() + 60 * 60 * 1000) {
      return { success: false, error: 'Le rendez-vous doit être au moins 1h dans le futur' }
    }

    // Vérifier que la date est dans les 90 jours
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 90)
    if (appointmentDate > maxDate) {
      return { success: false, error: 'Le rendez-vous ne peut pas être à plus de 90 jours' }
    }

    // Vérifier les horaires d'ouverture
    const dayOfWeek = appointmentDate.getDay()
    const businessHours = await prisma.businessHours.findUnique({
      where: { companyId_dayOfWeek: { companyId: company.id, dayOfWeek } }
    })
    if (!businessHours || !businessHours.isOpen) {
      return { success: false, error: 'L\'entreprise est fermée ce jour-là' }
    }

    const timeStr = `${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}`
    const duration = validated.duration || service.avgTime
    const endMinutes = appointmentDate.getHours() * 60 + appointmentDate.getMinutes() + duration
    const endTimeStr = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    if (timeStr < businessHours.openTime || endTimeStr > businessHours.closeTime) {
      return { success: false, error: `Le créneau est en dehors des horaires d'ouverture (${businessHours.openTime} - ${businessHours.closeTime})` }
    }

    // Vérifier les jours fermés
    const dateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
    const closedDate = await prisma.closedDate.findFirst({
      where: {
        companyId: company.id,
        date: dateOnly
      }
    })
    if (closedDate) {
      return { success: false, error: `L'entreprise est fermée ce jour (${closedDate.reason || 'fermeture exceptionnelle'})` }
    }

    // Vérifier les conflits de créneaux
    const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60 * 1000)
    const conflict = await prisma.appointment.findFirst({
      where: {
        companyId: company.id,
        serviceId: validated.serviceId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { appointmentDate: { lt: appointmentEnd } },
          {
            appointmentDate: {
              gte: new Date(appointmentDate.getTime() - duration * 60 * 1000)
            }
          }
        ]
      }
    })

    if (conflict) {
      return { success: false, error: 'Ce créneau n\'est plus disponible' }
    }

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: {
        companyId: company.id,
        serviceId: validated.serviceId,
        postId: validated.postId || null,
        clientName: validated.clientName,
        clientEmail: validated.clientEmail || null,
        clientPhone: validated.clientPhone || null,
        appointmentDate,
        duration,
        notes: validated.notes || null,
      }
    })

    // Planifier les rappels (24h avant et 1h avant)
    const reminders = []
    const reminder24h = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000)
    const reminder1h = new Date(appointmentDate.getTime() - 60 * 60 * 1000)

    if (validated.clientEmail) {
      if (reminder24h > now) {
        reminders.push({
          appointmentId: appointment.id,
          reminderType: 'EMAIL' as const,
          scheduledFor: reminder24h,
        })
      }
      if (reminder1h > now) {
        reminders.push({
          appointmentId: appointment.id,
          reminderType: 'EMAIL' as const,
          scheduledFor: reminder1h,
        })
      }
    }

    if (validated.clientPhone) {
      if (reminder1h > now) {
        reminders.push({
          appointmentId: appointment.id,
          reminderType: 'SMS' as const,
          scheduledFor: reminder1h,
        })
      }
    }

    if (reminders.length > 0) {
      await prisma.appointmentReminder.createMany({ data: reminders })
    }

    return {
      success: true,
      appointmentId: appointment.id,
      cancelToken: appointment.cancelToken,
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { success: false, error: error.message }
    }
    console.error('[createAppointment] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue lors de la création du rendez-vous' }
  }
}

/**
 * Récupère les créneaux disponibles pour un service donné à une date donnée.
 * Route publique.
 */
export async function getAvailableSlots(
  pageName: string,
  serviceId: string,
  dateStr: string // Format YYYY-MM-DD
): Promise<{ slots: string[]; duration: number } | null> {
  try {
    const validatedPageName = pageNameSchema.parse(pageName)

    const company = await prisma.company.findUnique({
      where: { pageName: validatedPageName },
      select: { id: true }
    })
    if (!company) return null

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, companyId: true, avgTime: true }
    })
    if (!service || service.companyId !== company.id) return null

    const targetDate = new Date(dateStr + 'T00:00:00')
    const dayOfWeek = targetDate.getDay()

    // Vérifier les horaires d'ouverture
    const businessHours = await prisma.businessHours.findUnique({
      where: { companyId_dayOfWeek: { companyId: company.id, dayOfWeek } }
    })
    if (!businessHours || !businessHours.isOpen) return { slots: [], duration: service.avgTime }

    // Vérifier si jour fermé
    const closedDate = await prisma.closedDate.findFirst({
      where: { companyId: company.id, date: targetDate }
    })
    if (closedDate) return { slots: [], duration: service.avgTime }

    // Récupérer les RDV existants ce jour-là
    const dayStart = new Date(dateStr + 'T00:00:00')
    const dayEnd = new Date(dateStr + 'T23:59:59')
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        companyId: company.id,
        serviceId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        appointmentDate: { gte: dayStart, lte: dayEnd }
      },
      select: { appointmentDate: true, duration: true }
    })

    // Générer les créneaux possibles
    const [openH, openM] = businessHours.openTime.split(':').map(Number)
    const [closeH, closeM] = businessHours.closeTime.split(':').map(Number)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM
    const slotDuration = service.avgTime
    const slots: string[] = []

    const now = new Date()

    for (let minutes = openMinutes; minutes + slotDuration <= closeMinutes; minutes += slotDuration) {
      const slotDate = new Date(targetDate)
      slotDate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

      // Ne pas proposer les créneaux passés (marge 1h)
      if (slotDate.getTime() < now.getTime() + 60 * 60 * 1000) continue

      // Vérifier conflit avec RDV existants
      const slotEnd = new Date(slotDate.getTime() + slotDuration * 60 * 1000)
      const hasConflict = existingAppointments.some((apt: { appointmentDate: Date; duration: number }) => {
        const aptStart = new Date(apt.appointmentDate)
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60 * 1000)
        return slotDate < aptEnd && slotEnd > aptStart
      })

      if (!hasConflict) {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0')
        const m = (minutes % 60).toString().padStart(2, '0')
        slots.push(`${h}:${m}`)
      }
    }

    return { slots, duration: service.avgTime }
  } catch (error) {
    console.error('[getAvailableSlots] Erreur:', error)
    return null
  }
}

/**
 * Récupère les rendez-vous d'une entreprise (OWNER/ADMIN).
 */
export async function getAppointmentsByCompany(
  startDate?: string,
  endDate?: string,
  status?: string
) {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      throw new Error('Accès réservé aux OWNER/ADMIN')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { companyId: access.companyId }

    if (startDate || endDate) {
      where.appointmentDate = {}
      if (startDate) where.appointmentDate.gte = new Date(startDate)
      if (endDate) where.appointmentDate.lte = new Date(endDate)
    }

    if (status) {
      where.status = status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        service: { select: { name: true } },
        post: { select: { name: true } },
      },
      orderBy: { appointmentDate: 'asc' }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return appointments.map((apt: any) => ({
      id: apt.id,
      clientName: apt.clientName,
      clientEmail: apt.clientEmail,
      clientPhone: apt.clientPhone,
      appointmentDate: apt.appointmentDate.toISOString(),
      duration: apt.duration,
      status: apt.status,
      serviceName: apt.service.name,
      postName: apt.post?.name || null,
      notes: apt.notes,
      cancelReason: apt.cancelReason,
      createdAt: apt.createdAt.toISOString(),
    }))
  } catch (error) {
    console.error('[getAppointmentsByCompany] Erreur:', error)
    throw error
  }
}

/**
 * Récupère un rendez-vous par ID (public, via cancelToken).
 */
export async function getAppointmentByToken(cancelToken: string) {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken },
      include: {
        service: { select: { name: true } },
        company: { select: { name: true } },
        post: { select: { name: true } },
      }
    })

    if (!appointment) return null

    return {
      id: appointment.id,
      clientName: appointment.clientName,
      appointmentDate: appointment.appointmentDate.toISOString(),
      duration: appointment.duration,
      status: appointment.status,
      serviceName: appointment.service.name,
      companyName: appointment.company.name,
      postName: appointment.post?.name || null,
      notes: appointment.notes,
      cancelReason: appointment.cancelReason,
    }
  } catch (error) {
    console.error('[getAppointmentByToken] Erreur:', error)
    return null
  }
}

/**
 * Annule un rendez-vous (via cancelToken — public).
 */
export async function cancelAppointmentByToken(
  cancelToken: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { cancelToken },
      select: { id: true, status: true, appointmentDate: true }
    })

    if (!appointment) {
      return { success: false, error: 'Rendez-vous introuvable' }
    }

    if (appointment.status === 'CANCELLED') {
      return { success: false, error: 'Ce rendez-vous est déjà annulé' }
    }

    if (appointment.status === 'COMPLETED') {
      return { success: false, error: 'Ce rendez-vous est déjà terminé' }
    }

    await prisma.appointment.update({
      where: { cancelToken },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason?.trim().slice(0, 200) || null,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('[cancelAppointmentByToken] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Confirme un rendez-vous (OWNER/ADMIN).
 */
export async function confirmAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, companyId: true, status: true }
    })

    if (!appointment || appointment.companyId !== access.companyId) {
      return { success: false, error: 'Rendez-vous introuvable' }
    }

    if (appointment.status !== 'PENDING') {
      return { success: false, error: `Impossible de confirmer un rendez-vous ${appointment.status}` }
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CONFIRMED' }
    })

    return { success: true }
  } catch (error) {
    console.error('[confirmAppointment] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Met à jour le statut d'un rendez-vous (OWNER/ADMIN).
 * Statuts possibles : COMPLETED, NO_SHOW, CANCELLED
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED',
  cancelReason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, companyId: true, status: true }
    })

    if (!appointment || appointment.companyId !== access.companyId) {
      return { success: false, error: 'Rendez-vous introuvable' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status: newStatus }
    if (newStatus === 'CANCELLED') {
      updateData.cancelledAt = new Date()
      updateData.cancelReason = cancelReason?.trim().slice(0, 200) || null
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData
    })

    return { success: true }
  } catch (error) {
    console.error('[updateAppointmentStatus] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Check-in d'un rendez-vous : crée un ticket prioritaire lié au RDV.
 * Le client avec RDV est inséré en tête de file (priority = APPOINTMENT).
 * 
 * Sécurité : OWNER/ADMIN uniquement, vérification que le RDV appartient à l'entreprise.
 * Règles métier :
 *  - Le RDV doit être CONFIRMED
 *  - L'heure actuelle doit être dans une fenêtre de ±30 min autour de l'heure du RDV
 *  - Un seul ticket peut être créé par RDV (appointmentId @unique)
 */
export async function checkInAppointment(
  appointmentId: string
): Promise<{ success: boolean; ticketNum?: string; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: { select: { id: true, name: true, avgTime: true } },
        tickets: { select: { id: true } },
      }
    })

    if (!appointment || appointment.companyId !== access.companyId) {
      return { success: false, error: 'Rendez-vous introuvable' }
    }

    if (appointment.status !== 'CONFIRMED') {
      return { success: false, error: `Impossible de faire le check-in d'un rendez-vous ${appointment.status}. Le RDV doit être confirmé.` }
    }

    // Vérifier qu'aucun ticket n'est déjà lié à ce RDV
    if (appointment.tickets.length > 0) {
      return { success: false, error: 'Un ticket existe déjà pour ce rendez-vous' }
    }

    // Vérifier la fenêtre de temps (±30 min autour de l'heure du RDV)
    const now = new Date()
    const aptTime = new Date(appointment.appointmentDate)
    const diffMinutes = (now.getTime() - aptTime.getTime()) / (60 * 1000)

    if (diffMinutes < -30) {
      const minutesUntil = Math.ceil(Math.abs(diffMinutes) - 30)
      return { success: false, error: `Le check-in sera disponible dans ${minutesUntil} min (30 min avant le RDV)` }
    }

    if (diffMinutes > 30) {
      return { success: false, error: 'La fenêtre de check-in est dépassée (±30 min). Marquez le RDV comme absent si nécessaire.' }
    }

    // Créer le ticket prioritaire
    const ticketNum = generateTicketNumber()
    await prisma.ticket.create({
      data: {
        serviceId: appointment.serviceId,
        num: ticketNum,
        nameComplete: appointment.clientName,
        status: 'PENDING',
        priority: 'APPOINTMENT',
        appointmentId: appointment.id,
        phoneNumber: appointment.clientPhone || null,
        whatsappConsent: false,
      }
    })

    // Mettre à jour le statut du RDV
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' }
    })

    return { success: true, ticketNum }
  } catch (error) {
    console.error('[checkInAppointment] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue lors du check-in' }
  }
}

/**
 * Détecte et marque automatiquement les RDV NO_SHOW.
 * Un RDV est considéré NO_SHOW si :
 *  - Son statut est CONFIRMED
 *  - L'heure du RDV est dépassée de plus de 15 min
 *  - Aucun ticket n'a été créé (pas de check-in)
 * 
 * Appelé automatiquement lors du chargement du dashboard /appointments.
 * Sécurité : OWNER/ADMIN uniquement.
 */
export async function processNoShows(): Promise<{ processed: number }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { processed: 0 }
    }

    const now = new Date()
    const threshold = new Date(now.getTime() - 15 * 60 * 1000) // 15 min dans le passé

    // Trouver les RDV CONFIRMED dont l'heure est dépassée de >15 min
    // et qui n'ont aucun ticket associé (pas de check-in)
    const overdueAppointments = await prisma.appointment.findMany({
      where: {
        companyId: access.companyId,
        status: 'CONFIRMED',
        appointmentDate: { lt: threshold },
        tickets: { none: {} },
      },
      select: { id: true }
    })

    if (overdueAppointments.length === 0) {
      return { processed: 0 }
    }

    // Mettre à jour tous les RDV en NO_SHOW
    await prisma.appointment.updateMany({
      where: {
        id: { in: overdueAppointments.map((a) => a.id) }
      },
      data: { status: 'NO_SHOW' }
    })

    console.log(`[processNoShows] ${overdueAppointments.length} RDV marqués NO_SHOW`)
    return { processed: overdueAppointments.length }
  } catch (error) {
    console.error('[processNoShows] Erreur:', error)
    return { processed: 0 }
  }
}

/**
 * Récupère les RDV du jour qui ont un créneau proche pour affichage dans la vue poste.
 * Permet au staff de voir les RDV à venir dans la file d'attente.
 * Sécurité : OWNER/ADMIN/STAFF authentifié.
 */
export async function getTodayAppointments(): Promise<{
  upcoming: Array<{
    id: string
    clientName: string
    appointmentDate: string
    duration: number
    serviceName: string
    status: string
    hasTicket: boolean
  }>
}> {
  try {
    const access = await verifyStaffAccess()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    const appointments = await prisma.appointment.findMany({
      where: {
        companyId: access.companyId,
        appointmentDate: { gte: todayStart, lt: todayEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        service: { select: { name: true } },
        tickets: { select: { id: true } },
      },
      orderBy: { appointmentDate: 'asc' }
    })

    return {
      upcoming: appointments.map((apt) => ({
        id: apt.id,
        clientName: apt.clientName,
        appointmentDate: apt.appointmentDate.toISOString(),
        duration: apt.duration,
        serviceName: apt.service.name,
        status: apt.status,
        hasTicket: apt.tickets.length > 0,
      }))
    }
  } catch (error) {
    console.error('[getTodayAppointments] Erreur:', error)
    return { upcoming: [] }
  }
}

/**
 * Statistiques des rendez-vous (OWNER/ADMIN).
 */
export async function getAppointmentStats() {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      throw new Error('Accès réservé aux OWNER/ADMIN')
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Lundi

    const [total, todayCount, weekCount, statusCounts, noShowCount] = await Promise.all([
      prisma.appointment.count({ where: { companyId: access.companyId } }),
      prisma.appointment.count({
        where: {
          companyId: access.companyId,
          appointmentDate: { gte: todayStart, lt: todayEnd }
        }
      }),
      prisma.appointment.count({
        where: {
          companyId: access.companyId,
          appointmentDate: { gte: weekStart }
        }
      }),
      prisma.appointment.groupBy({
        by: ['status'],
        where: { companyId: access.companyId },
        _count: true
      }),
      prisma.appointment.count({
        where: { companyId: access.companyId, status: 'NO_SHOW' }
      })
    ])

    const completedCount = statusCounts.find((s: { status: string; _count: number }) => s.status === 'COMPLETED')?._count || 0
    const noShowRate = (completedCount + noShowCount) > 0
      ? Math.round((noShowCount / (completedCount + noShowCount)) * 100)
      : 0

    return {
      total,
      todayCount,
      weekCount,
      noShowRate,
      byStatus: Object.fromEntries(
        statusCounts.map((s: { status: string; _count: number }) => [s.status, s._count])
      )
    }
  } catch (error) {
    console.error('[getAppointmentStats] Erreur:', error)
    throw error
  }
}
