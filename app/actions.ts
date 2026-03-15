"use server"

import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { verifyCompanyOwnership, getCurrentUserEmail, verifyStaffAccess } from '@/lib/auth'
import { checkRateLimit, rateLimitConfig, RateLimitError } from '@/lib/ratelimit'
import {
  serviceNameSchema,
  pageNameSchema,
  customerNameSchema,
  postNameSchema,
  avgTimeSchema,
  emailSchema
} from '@/lib/validation'

/**
 * Génère un numéro de ticket sécurisé en utilisant crypto
 * Format: T[timestamp en base 36][4 bytes aléatoires en base 36]
 * Exemple: T20250301A4K9L
 */
function generateTicketNumber(): string {
  const date = Date.now().toString(36)
  const random = crypto.getRandomValues(new Uint8Array(4))
    .reduce((acc, byte) => acc + byte.toString(36), '')
  return `T${date}${random}`.toUpperCase().substring(0, 10)
}

/**
 * Initialise la session utilisateur en une seule requête : vérifie/crée l'utilisateur, retourne son rôle et pageName
 */
export async function initUserSession(email: string, name: string): Promise<{
    role: 'OWNER' | 'ADMIN' | 'STAFF' | null,
    pageName: string | null
}> {
    if (!email) return { role: null, pageName: null }
    try {
        const validatedEmail = emailSchema.parse(email)

        // Vérifier si c'est une entreprise existante
        const existingCompany = await prisma.company.findUnique({
            where: { email: validatedEmail },
            select: { id: true, pageName: true }
        })

        if (existingCompany) {
            return { role: 'OWNER' as const, pageName: existingCompany.pageName ?? null }
        }

        // Vérifier si c'est un staff
        const existingStaff = await prisma.staff.findFirst({
            where: { email: validatedEmail },
            select: { role: true, company: { select: { pageName: true } } }
        })

        if (existingStaff) {
            const role = existingStaff.role === 'ADMIN' ? 'ADMIN' as const : 'STAFF' as const
            return { role, pageName: existingStaff.company?.pageName ?? null }
        }

        // Nouveau propriétaire : créer l'entreprise (validation du nom uniquement ici)
        if (name) {
            const validatedName = customerNameSchema.parse(name)
            await prisma.company.create({
                data: { email: validatedEmail, name: validatedName }
            })
        }

        return { role: 'OWNER' as const, pageName: null }
    } catch (error) {
        console.error('[initUserSession] Error:', error)
        return { role: null, pageName: null }
    }
}

export async function checkAndAddUser(email: string, name: string) {
    if (!email) return
    try {
        // Validation
        const validatedEmail = emailSchema.parse(email)
        const validatedName = customerNameSchema.parse(name)

        // 1. Vérifier si c'est déjà une entreprise existante
        const existingCompany = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })
        if (existingCompany) {
            return // L'entreprise existe déjà
        }

        // 2. Vérifier si c'est un staff d'une entreprise existante
        const existingStaff = await prisma.staff.findFirst({
            where: { email: validatedEmail }
        })
        if (existingStaff) {
            return // C'est un employé, ne pas créer d'entreprise
        }

        // 3. Si ni entreprise ni staff, créer une nouvelle entreprise
        if (validatedName) {
            await prisma.company.create({
                data: { email: validatedEmail, name: validatedName }
            })
        }
    } catch (error) {
        console.error("Error in checkAndAddUser:", error)
    }
}

export async function createService(email: string, serviceName: string, avgTime: number) {
    if (!email || !serviceName || avgTime == null) return
    try {
        // Rate limiting: 5 services par minute par email
        const { success: rateLimitSuccess } = await checkRateLimit(
          `service:${email}`,
          rateLimitConfig.createService.limit,
          rateLimitConfig.createService.windowMs
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de services créés. Veuillez attendre une minute.')
        }

        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)
        const validatedServiceName = serviceNameSchema.parse(serviceName)
        const validatedAvgTime = avgTimeSchema.parse(avgTime)

        const existingCompany = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })
        if (existingCompany) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const newService = await prisma.service.create({
                data: {
                    name: validatedServiceName,
                    avgTime: validatedAvgTime,
                    companyId: existingCompany.id
                }
            })
        } else {
            console.error("Company not found for email:", validatedEmail)
        }
    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error("Error in createService:", error)
    }
}

export async function getServiceByEmail(email: string) {
    if (!email) return
    try {
        // Verify staff access (OWNER, ADMIN ou STAFF)
        const accessInfo = await verifyStaffAccess()

        const services = await prisma.service.findMany({
            where: { companyId: accessInfo.companyId },
            include: { company: true }
        })
        return services
    } catch (error) {
        console.error("Error in getServiceByEmail:", error)
    }
}

export async function deleteServiceById(serviceId: string) {
    if (!serviceId) return
    try {
        // Get authenticated user
        const userEmail = await getCurrentUserEmail()
        if (!userEmail) {
            throw new Error('Authentification requise')
        }

        // Rate limiting: 10 délétions par minute par email
        const { success: rateLimitSuccess } = await checkRateLimit(
          `delete-service:${userEmail}`,
          10,
          60 * 1000
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de services supprimés. Veuillez attendre une minute.')
        }

        // Verify service belongs to user's company
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { company: true }
        })

        if (!service) {
            throw new Error('Service non trouvé')
        }

        if (service.company.email.toLowerCase() !== userEmail.toLowerCase()) {
            throw new Error('Vous n\'avez pas accès à ce service')
        }

        await prisma.service.delete({
            where: { id: serviceId }
        })
    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error(error)
    }
}

export async function getCompanyPageName(email: string) {
    try {
        // 1. Vérifier si c'est le propriétaire d'une entreprise
        const company = await prisma.company.findUnique({
            where: { email: email }
        })

        if (company) {
            return company.pageName
        }

        // 2. Vérifier si c'est un staff et récupérer le pageName de son entreprise
        const staff = await prisma.staff.findFirst({
            where: { email: email },
            include: {
                company: {
                    select: {
                        pageName: true
                    }
                }
            }
        })

        if (staff && staff.company) {
            return staff.company.pageName
        }

    } catch (error) {
        console.error(error)
    }
}

export async function getUserRole(email: string): Promise<'OWNER' | 'ADMIN' | 'STAFF' | null> {
    try {
        // 1. Vérifier si c'est le propriétaire d'une entreprise
        const company = await prisma.company.findUnique({
            where: { email: email }
        })

        if (company) {
            return 'OWNER' as const
        }

        // 2. Vérifier si c'est un staff
        const staff = await prisma.staff.findFirst({
            where: { email: email },
            select: {
                role: true
            }
        })

        if (staff) {
            // Forcer le typage explicite pour la sérialisation
            return staff.role === 'ADMIN' ? 'ADMIN' as const : 'STAFF' as const
        }

        return null
    } catch (error) {
        console.error('Error in getUserRole:', error)
        return null
    }
}

export async function setCompanyPageName(email: string, pageName: string) {
    try {
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)
        const validatedPageName = pageNameSchema.parse(pageName)

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const company = await prisma.company.findUnique({
            where: {
                email: validatedEmail
            }
        })
        await prisma.company.update({
            where: { email: validatedEmail },
            data: { pageName: validatedPageName }
        })
    } catch (error) {
        console.error(error)
    }

}

export async function getServicesByPageName(pageName: string) {
    try {
        // Validation
        const validatedPageName = pageNameSchema.parse(pageName)

        const company = await prisma.company.findUnique({
            where: {
                pageName: validatedPageName
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée avec le nom de page : ${validatedPageName}`)
        }

        const services = await prisma.service.findMany({
            where: { companyId: company?.id },
            include: {
                company: true
            }
        })
        return services

    } catch (error) {
        console.error(error)
    }
}

export async function createTicket(
    serviceId: string,
    nameComplete: string,
    pageName: string,
    phoneNumber?: string,
    whatsappConsent?: boolean,
) {
    try {
        // Rate limiting: 10 tickets par minute par page
        const validatedPageName = pageNameSchema.parse(pageName)
        const { success: rateLimitSuccess } = await checkRateLimit(
          `ticket:${validatedPageName}`,
          rateLimitConfig.createTicket.limit,
          rateLimitConfig.createTicket.windowMs
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de tickets créés. Veuillez attendre une minute.')
        }

        // Validation
        const validatedNameComplete = customerNameSchema.parse(nameComplete)

        const company = await prisma.company.findUnique({
            where: {
                pageName: validatedPageName
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée avec le nom de page : ${validatedPageName}`)
        }

        // Validation du numéro WhatsApp (si fourni)
        let validatedPhone: string | null = null
        if (phoneNumber && whatsappConsent) {
            const { validatePhoneNumber } = await import('@/lib/whatsapp')
            const { valid, formatted, error } = validatePhoneNumber(phoneNumber)
            if (!valid) {
                throw new Error(error || 'Numéro de téléphone invalide')
            }
            validatedPhone = formatted
        }

        const ticketNum = generateTicketNumber()

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ticket = await prisma.ticket.create({
            data: {
                serviceId,
                nameComplete: validatedNameComplete,
                num: ticketNum,
                status: "PENDING",
                phoneNumber: validatedPhone,
                whatsappConsent: !!(whatsappConsent && validatedPhone),
            }
        })

        return ticketNum

    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error(error)
        throw error
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getPendingTicketsByEmail(email:string) {
    try {
        // Verify staff access (OWNER, ADMIN ou STAFF)
        const accessInfo = await verifyStaffAccess()

        // Si c'est un STAFF, récupérer les services de ses postes assignés
        let assignedServiceIds: string[] = []
        if (accessInfo.role === 'STAFF' && accessInfo.staffId) {
            const staff = await prisma.staff.findUnique({
                where: { id: accessInfo.staffId },
                include: { 
                    assignedPosts: {
                        select: { serviceId: true }
                    }
                }
            })
            // Extraire les serviceIds uniques des postes assignés
            assignedServiceIds = [...new Set(staff?.assignedPosts.map(post => post.serviceId) || [])]
        }

        const company = await prisma.company.findUnique({
            where: {
                id: accessInfo.companyId
            },
            include: {
                services : {
                    // Si STAFF, filtrer par services de ses postes
                    where: accessInfo.role === 'STAFF' && assignedServiceIds.length > 0 ? {
                        id: { in: assignedServiceIds }
                    } : {},
                    include : {
                        tickets: {
                            where : {
                                status : {
                                    in: ["PENDING", "CALL", "IN_PROGRESS"]
                                }
                            },
                            orderBy: {
                                createdAt: "asc"
                            },
                            include: {}
                        }    
                    }
                }
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée`)
        }
        let pendingTickets = company.services.flatMap((service) =>
            service.tickets.map((Ticket) => ({
                ...Ticket,
                serviceName : service.name,
                avgTime : service.avgTime
            }))
        )

        pendingTickets = pendingTickets.sort(
            (a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )

        return pendingTickets

    } catch (error) {
        console.error(error)
    }
}

/**
 * Récupère les tickets pour l'affichage public TV.
 * Route publique (pas d'authentification requise).
 * Retourne uniquement les données nécessaires à l'affichage (pas de données sensibles).
 */
export async function getTicketsForDisplay(pageName: string) {
    try {
        const validatedPageName = pageNameSchema.parse(pageName)

        const company = await prisma.company.findUnique({
            where: { pageName: validatedPageName },
            select: {
                id: true,
                name: true,
                services: {
                    include: {
                        tickets: {
                            where: {
                                status: { in: ['CALL', 'IN_PROGRESS', 'PENDING'] }
                            },
                            orderBy: { createdAt: 'asc' },
                            select: {
                                id: true,
                                num: true,
                                status: true,
                                createdAt: true,
                                postName: true,
                            }
                        }
                    }
                }
            }
        })

        if (!company) {
            return null
        }

        const allTickets = company.services.flatMap((service) =>
            service.tickets.map((ticket) => ({
                ...ticket,
                serviceName: service.name,
                createdAt: ticket.createdAt.toISOString(),
            }))
        )

        const callTickets = allTickets
            .filter(t => t.status === 'CALL')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const inProgressTickets = allTickets
            .filter(t => t.status === 'IN_PROGRESS')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const pendingTickets = allTickets
            .filter(t => t.status === 'PENDING')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(0, 10)

        return {
            companyName: company.name,
            callTickets,
            inProgressTickets,
            pendingTickets,
            totalPending: allTickets.filter(t => t.status === 'PENDING').length,
        }
    } catch (error) {
        console.error('[getTicketsForDisplay] Error:', error)
        return null
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTicketsByIds(ticketNums : any[]) {
    try {
        const tickets = await prisma.ticket.findMany({
            where : {
                num : {
                    in : ticketNums
                }
            },
            orderBy : {
                createdAt : 'asc'
            },
            include : {
                service : true,
                post : true
            }
        })

        if(ticketNums.length == 0) {
            throw new Error('Aucun ticket trouvé');
        }

        return tickets.map(ticket => ({
            ...ticket,
            serviceName: ticket.service.name,
            avgTime: ticket.service.avgTime
        }))
        
    } catch (error) {
        console.error(error)
    }
}

export async function createPost (email: string, postName: string, serviceId: string) {
    try {
        // Rate limiting: 5 postes par minute par email
        const { success: rateLimitSuccess } = await checkRateLimit(
          `post:${email}`,
          rateLimitConfig.createPost.limit,
          rateLimitConfig.createPost.windowMs
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de postes créés. Veuillez attendre une minute.')
        }

        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)
        const validatedPostName = postNameSchema.parse(postName)

        const company = await prisma.company.findUnique({
            where: {
                email: validatedEmail
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée avec cet Email`)
        }

        // Vérifier que le service appartient à l'entreprise
        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        })

        if (!service || service.companyId !== company.id) {
            throw new Error('Service invalide ou n\'appartient pas à votre entreprise')
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const newPost = await prisma.post.create({
            data: {
                name : validatedPostName,
                companyId : company.id,
                serviceId : serviceId
            }
        })
    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error(error)
    }
}

export async function deletePost (postId: string) {
    try {
        // Get authenticated user
        const userEmail = await getCurrentUserEmail()
        if (!userEmail) {
            throw new Error('Authentification requise')
        }

        // Rate limiting: 10 délétions de postes par minute par email
        const { success: rateLimitSuccess } = await checkRateLimit(
          `delete-post:${userEmail}`,
          10,
          60 * 1000
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de postes supprimés. Veuillez attendre une minute.')
        }

        // Verify post belongs to user's company
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { company: true }
        })

        if (!post) {
            throw new Error('Poste non trouvé')
        }

        if (post.company.email.toLowerCase() !== userEmail.toLowerCase()) {
            throw new Error('Vous n\'avez pas accès à ce poste')
        }

        await prisma.post.delete({
            where: { id: postId }
        })
    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error(error)
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getPostsByCompanyEmail(email: string) {
    try {
        // Verify staff access (OWNER, ADMIN ou STAFF)
        const accessInfo = await verifyStaffAccess()

        const posts = await prisma.post.findMany({
            where: {
                companyId: accessInfo.companyId
            },
            include: {
                company: true,
                service: true
            }
        })
        return posts

    } catch (error) {
        console.error(error)
    }
}

export async function getPostNameById(postId: string) {
    try {
        const post = await prisma.post.findUnique({
            where: {id: postId },
            select: {name: true}
        })
        if(post){
            return post.name
        }else {
            throw new Error('Poste non trouvé')
        }
    } catch (error) {
        console.error(error)
    }
}

export async function getLastTicketByEmail(email: string, idPoste: string) {
    try {
        // Verify staff access (OWNER, ADMIN ou STAFF)
        const accessInfo = await verifyStaffAccess()

        // Si STAFF, vérifier qu'il a accès à ce poste
        if (accessInfo.role === 'STAFF' && accessInfo.staffId) {
            const staff = await prisma.staff.findUnique({
                where: { id: accessInfo.staffId },
                include: { assignedPosts: true }
            })
            const hasAccess = staff?.assignedPosts.some(post => post.id === idPoste)
            if (!hasAccess) {
                throw new Error('Vous n\'avez pas accès à ce poste')
            }
        }

        const existingTicket = await prisma.ticket.findFirst({
            where: {
                postId: idPoste,
                status: { in: ["CALL", "IN_PROGRESS"] }
            },
            orderBy: { createdAt: "asc" },
            include: { service: true, post: true }
        })

        if (existingTicket && existingTicket.service) {
            return {
                ...existingTicket,
                serviceName: existingTicket.service.name,
                avgTime: existingTicket.service.avgTime
            }

        }

        const ticket = await prisma.ticket.findFirst({
            where: {
                status: "PENDING",
                service: { company: { id: accessInfo.companyId } }
            },
            orderBy: { createdAt: "asc" },
            include: { service: true, post: true }
        })

        if (!ticket || !ticket?.service) return null

        const post = await prisma.post.findUnique({
            where: { id: idPoste }
        })

        if (!post) {
            console.error(`Aucun poste trouvé pour l'ID: ${idPoste}`);
            return null;
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                status: "CALL",
                postId: post.id,
                postName: post.name
            },
            include: { service: true }
        })

        // Notifications WhatsApp (non-bloquant)
        try {
            const { checkAndNotifyUpcomingTickets, notifyTicketCalled } = await import('@/app/actions/whatsapp')
            notifyTicketCalled(updatedTicket.id).catch(console.error)
            checkAndNotifyUpcomingTickets(updatedTicket.serviceId).catch(console.error)
        } catch (whatsappError) {
            console.error('[WhatsApp] Erreur notification (non-bloquant):', whatsappError)
        }

        return {
            ...updatedTicket,
            serviceName: updatedTicket.service.name,
            avgTime: updatedTicket.service.avgTime
        }

    } catch (error) {
        console.error(error)
    }
}

export async function updateTicketStatus(ticketId: string, newStatus: string) {
    try {
        const email = await getCurrentUserEmail()
        if (!email) {
            throw new Error('Utilisateur non authentifié')
        }

        // Verify staff access (OWNER, ADMIN ou STAFF)
        await verifyStaffAccess()

        // Rate limiting: 20 mises à jour par minute par ticket
        const { success: rateLimitSuccess } = await checkRateLimit(
          `update-ticket:${ticketId}`,
          rateLimitConfig.updateTicket.limit,
          rateLimitConfig.updateTicket.windowMs
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de mises à jour. Veuillez attendre une minute.')
        }

        const updatedTicket = await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: newStatus },
            select: { id: true, serviceId: true, status: true }
        })

        // Notifications WhatsApp (non-bloquant)
        try {
            const { checkAndNotifyUpcomingTickets, notifyTicketCalled } = await import('@/app/actions/whatsapp')

            if (newStatus === 'CALL') {
                // Notifier le client que son ticket est appelé
                notifyTicketCalled(ticketId).catch(console.error)
            }

            if (newStatus === 'PROCESSING' || newStatus === 'FINISHED') {
                // Notifier les prochains clients dans la file
                checkAndNotifyUpcomingTickets(updatedTicket.serviceId).catch(console.error)
            }
        } catch (whatsappError) {
            // Ne pas bloquer le flux principal si WhatsApp échoue
            console.error('[WhatsApp] Erreur notification (non-bloquant):', whatsappError)
        }
    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error(error)
    }
}

export async function get10LstFinishedTicketsByEmail(email: string) {
    try {
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)

        const tickets = await prisma.ticket.findMany({
            where: {
                status: "FINISHED",
                service: { company: { email: validatedEmail } }
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { service: true, post: true }
        })

        return tickets.map(ticket => ({
            ...ticket,
            serviceName: ticket.service?.name,
            avgTime: ticket.service?.avgTime,
        }))
    } catch (error) {
        console.error(error)
    }
}

export async function getTicketStatsByEmail(email: string) {
    try {
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)

        const tickets = await prisma.ticket.findMany({
            where: {
                service: { company: { email: validatedEmail } }
            }
        })
        const totalTickets = tickets.length
        const resolvedTickets = tickets.filter(ticket => ticket.status === "FINISHED").length
        const pendingTickets = tickets.filter(ticket => ticket.status === "PENDING").length

        return {
            totalTickets,
            resolvedTickets,
            pendingTickets
        }
    } catch (error) {
        console.error(error)
        return {
            totalTickets: 0,
            resolvedTickets: 0,
            pendingTickets: 0
        }
    }
}

export async function getTicketsWithContext(ticketNums: string[], pageName: string) {
    try {
        // Validation
        const validatedPageName = pageNameSchema.parse(pageName)

        // 1. Récupérer les tickets du client
        const clientTickets = await prisma.ticket.findMany({
            where: {
                num: {
                    in: ticketNums
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                service: true,
                // post: true
            }
        })

        if (ticketNums.length === 0 || !clientTickets || clientTickets.length === 0) {
            throw new Error('Aucun ticket trouvé')
        }

        // 2. Récupérer l'entreprise
        const company = await prisma.company.findUnique({
            where: {
                pageName: validatedPageName
            }
        })

        if (!company) {
            throw new Error(`Aucune entreprise trouvée avec le pageName: ${validatedPageName}`)
        }

        // 3. Récupérer TOUS les tickets en attente de l'entreprise
        // pour avoir le contexte complet de la queue
        const allPendingTickets = await prisma.ticket.findMany({
            where: {
                status: {
                    in: ["PENDING", "CALL", "IN_PROGRESS"]
                },
                service: {
                    companyId: company.id
                }
            },
            orderBy: {
                createdAt: 'asc'
            },
            include: {
                service: true,
                post: true
            }
        })

        // 4. Filtrer pour ne garder que les tickets non-FINISHED du client
        const validClientTickets = clientTickets.filter(t => t.status !== "FINISHED")

        // 5. Enrichir les données avec serviceName et avgTime
        const enrichedClientTickets = validClientTickets.map(ticket => ({
            ...ticket,
            serviceName: ticket.service.name,
            avgTime: ticket.service.avgTime
        }))

        const enrichedAllTickets = allPendingTickets.map(ticket => ({
            ...ticket,
            serviceName: ticket.service.name,
            avgTime: ticket.service.avgTime
        }))

        return {
            clientTickets: enrichedClientTickets,
            allTickets: enrichedAllTickets
        }

    } catch (error) {
        console.error(error)
        return {
            clientTickets: [],
            allTickets: []
        }
    }
}

// STAFF MANAGEMENT

/**
 * Ajoute un employé à une entreprise
 */
export async function addStaff(email: string, staffEmail: string, staffName: string, role: 'ADMIN' | 'STAFF' = 'STAFF') {
    try {
        // Vérifier que l'utilisateur actuel est propriétaire de l'entreprise
        await verifyCompanyOwnership(email)

        // Validation des entrées
        const validatedEmail = emailSchema.parse(email)
        const validatedStaffEmail = emailSchema.parse(staffEmail)
        const validatedStaffName = customerNameSchema.parse(staffName)

        // Rate limiting
        const rlConfig = rateLimitConfig.addStaff
        await checkRateLimit(validatedEmail, rlConfig.limit, rlConfig.windowMs)

        // Récupérer l'entreprise
        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })

        if (!company) {
            throw new Error('Entreprise non trouvée')
        }

        // Vérifier si le staff existe déjà
        const existingStaff = await prisma.staff.findUnique({
            where: {
                email_companyId: {
                    email: validatedStaffEmail,
                    companyId: company.id
                }
            }
        })

        if (existingStaff) {
            throw new Error('Cet employé existe déjà dans votre entreprise')
        }

        // Créer le staff
        const staff = await prisma.staff.create({
            data: {
                email: validatedStaffEmail,
                name: validatedStaffName,
                role,
                companyId: company.id
            }
        })

        return staff
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error
        }
        console.error('Error in addStaff:', error)
        throw error
    }
}

/**
 * Récupère tous les employés d'une entreprise
 */
export async function getStaffByCompany(email: string) {
    try {
        await verifyCompanyOwnership(email)
        const validatedEmail = emailSchema.parse(email)

        const company = await prisma.company.findUnique({
            where: { email: validatedEmail },
            include: {
                staff: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        return company?.staff ?? []
    } catch (error) {
        console.error('Error in getStaffByCompany:', error)
        return []
    }
}

/**
 * Met à jour le rôle d'un employé
 */
export async function updateStaffRole(email: string, staffId: string, newRole: 'ADMIN' | 'STAFF') {
    try {
        await verifyCompanyOwnership(email)
        const validatedEmail = emailSchema.parse(email)

        // Rate limiting
        const rlConfig = rateLimitConfig.updateStaff
        await checkRateLimit(validatedEmail, rlConfig.limit, rlConfig.windowMs)

        // Vérifier que le staff appartient à l'entreprise
        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })

        if (!company) {
            throw new Error('Entreprise non trouvée')
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        })

        if (!staff || staff.companyId !== company.id) {
            throw new Error('Employé non trouvé ou non autorisé')
        }

        // Mettre à jour le rôle
        const updatedStaff = await prisma.staff.update({
            where: { id: staffId },
            data: { role: newRole }
        })

        return updatedStaff
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error
        }
        console.error('Error in updateStaffRole:', error)
        throw error
    }
}

/**
 * Supprime un employé
 */
export async function removeStaff(email: string, staffId: string) {
    try {
        await verifyCompanyOwnership(email)
        const validatedEmail = emailSchema.parse(email)

        // Rate limiting
        const rlConfig = rateLimitConfig.removeStaff
        await checkRateLimit(validatedEmail, rlConfig.limit, rlConfig.windowMs)

        // Vérifier que le staff appartient à l'entreprise
        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })

        if (!company) {
            throw new Error('Entreprise non trouvée')
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        })

        if (!staff || staff.companyId !== company.id) {
            throw new Error('Employé non trouvé ou non autorisé')
        }

        // Supprimer le staff
        await prisma.staff.delete({
            where: { id: staffId }
        })

        return { success: true }
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error
        }
        console.error('Error in removeStaff:', error)
        throw error
    }
}

/**
 * Assigne un poste à un employé
 */
export async function assignPostToStaff(email: string, staffId: string, postId: string) {
    try {
        await verifyCompanyOwnership(email)
        const validatedEmail = emailSchema.parse(email)

        // Rate limiting
        const rlConfig = rateLimitConfig.assignPost
        await checkRateLimit(validatedEmail, rlConfig.limit, rlConfig.windowMs)

        // Vérifier que le staff et le post appartiennent à l'entreprise
        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })

        if (!company) {
            throw new Error('Entreprise non trouvée')
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        })

        const post = await prisma.post.findUnique({
            where: { id: postId }
        })

        if (!staff || staff.companyId !== company.id) {
            throw new Error('Employé non trouvé ou non autorisé')
        }

        if (!post || post.companyId !== company.id) {
            throw new Error('Poste non trouvé ou non autorisé')
        }

        // Assigner le poste
        await prisma.staff.update({
            where: { id: staffId },
            data: {
                assignedPosts: {
                    connect: { id: postId }
                }
            }
        })

        return { success: true }
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error
        }
        console.error('Error in assignPostToStaff:', error)
        throw error
    }
}

/**
 * Retire un poste assigné à un employé
 */
export async function unassignPostFromStaff(email: string, staffId: string, postId: string) {
    try {
        await verifyCompanyOwnership(email)
        const validatedEmail = emailSchema.parse(email)

        // Rate limiting
        const rlConfig = rateLimitConfig.unassignPost
        await checkRateLimit(validatedEmail, rlConfig.limit, rlConfig.windowMs)

        // Vérifier que le staff appartient à l'entreprise
        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })

        if (!company) {
            throw new Error('Entreprise non trouvée')
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffId }
        })

        if (!staff || staff.companyId !== company.id) {
            throw new Error('Employé non trouvé ou non autorisé')
        }

        // Retirer le poste
        await prisma.staff.update({
            where: { id: staffId },
            data: {
                assignedPosts: {
                    disconnect: { id: postId }
                }
            }
        })

        return { success: true }
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error
        }
        console.error('Error in unassignPostFromStaff:', error)
        throw error
    }
}

/**
 * Récupère les postes assignés au staff actuellement connecté (s'auto-identifie via Clerk)
 */
export async function getMyAssignedPosts() {
    try {
        console.log('[getMyAssignedPosts] Starting...')
        const accessInfo = await verifyStaffAccess()
        console.log('[getMyAssignedPosts] Access info:', { role: accessInfo.role, staffId: accessInfo.staffId })
        
        if (!accessInfo.staffId) {
            console.log('[getMyAssignedPosts] No staffId, returning empty array')
            return []
        }

        const staff = await prisma.staff.findUnique({
            where: { id: accessInfo.staffId },
            select: {
                assignedPosts: {
                    select: {
                        id: true,
                        name: true,
                        companyId: true,
                        serviceId: true,
                        createdAt: true
                    }
                }
            }
        })

        const posts = staff?.assignedPosts ?? []
        console.log('[getMyAssignedPosts] Found', posts.length, 'assigned posts')
        
        // Convertir les dates en strings pour la sérialisation
        return posts.map((post: { id: string; name: string; companyId: string; serviceId: string; createdAt: Date }) => ({
            id: post.id,
            name: post.name,
            companyId: post.companyId,
            serviceId: post.serviceId,
            createdAt: post.createdAt.toISOString()
        }))
    } catch (error) {
        console.error('[getMyAssignedPosts] Error:', error)
        return []
    }
}

/**
 * Récupère les postes assignés à un employé
 */
export async function getAssignedPosts(email: string, staffId: string) {
    try {
        await verifyCompanyOwnership(email)
        const validatedEmail = emailSchema.parse(email)

        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })

        if (!company) {
            throw new Error('Entreprise non trouvée')
        }

        const staff = await prisma.staff.findUnique({
            where: { id: staffId },
            include: {
                assignedPosts: true
            }
        })

        if (!staff || staff.companyId !== company.id) {
            throw new Error('Employé non trouvé ou non autorisé')
        }

        return staff.assignedPosts
    } catch (error) {
        console.error('Error in getAssignedPosts:', error)
        return []
    }
}
