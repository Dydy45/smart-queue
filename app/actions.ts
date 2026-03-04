"use server"

import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { verifyCompanyOwnership, getCurrentUserEmail } from '@/lib/auth'
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

export async function checkAndAddUser(email: string, name: string) {
    if (!email) return
    try {
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)
        const validatedName = customerNameSchema.parse(name)

        const existingUser = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })
        if (!existingUser && validatedName) {
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
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)

        const company = await prisma.company.findUnique({
            where: { email: validatedEmail }
        })
        if (!company) {
            throw new Error("Company not found")
        }

        const services = await prisma.service.findMany({
            where: { companyId: company.id },
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
        const company = await prisma.company.findUnique({
            where: {
                email: email
            },
            select: {
                pageName: true
            }
        })

        if (company) {
            return company.pageName
        }

    } catch (error) {
        console.error(error)
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

export async function createTicket(serviceId:string , nameComplete:string , pageName:string) {
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

        const ticketNum = generateTicketNumber()

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ticket = await prisma.ticket.create({
            data: {
                serviceId,
                nameComplete: validatedNameComplete,
                num : ticketNum,
                status:"PENDING"
            }
        })

        return ticketNum

    } catch (error) {
        if (error instanceof RateLimitError) {
          throw error
        }
        console.error(error)
    }
}

export async function getPendingTicketsByEmail(email:string) {
    try {
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)

      const company = await prisma.company.findUnique({
            where: {
                email: validatedEmail
            },
            include: {
                services : {
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
            throw new Error(`Aucune entreprise trouvée avec le nom de page : ${validatedEmail}`)
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

export async function createPost (email: string, postName: string) {
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const newPost = await prisma.post.create({
            data: {
                name : validatedPostName,
                companyId : company.id
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

export async function getPostsByCompanyEmail(email: string) {
    try {
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)

        const company = await prisma.company.findUnique({
            where: {
                email: validatedEmail
            }
        })

        if (!company) {
            throw new Error(`Aucune entreprise trouvée avec cet email`);
        }

        const posts = await prisma.post.findMany({
            where: {
                companyId: company.id
            },
            include: {
                company: true
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
        // Verify ownership
        await verifyCompanyOwnership(email)

        // Validation
        const validatedEmail = emailSchema.parse(email)

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
                service: { company: { email: validatedEmail } }
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
        // Rate limiting: 20 mises à jour par minute par ticket
        const { success: rateLimitSuccess } = await checkRateLimit(
          `update-ticket:${ticketId}`,
          rateLimitConfig.updateTicket.limit,
          rateLimitConfig.updateTicket.windowMs
        )
        if (!rateLimitSuccess) {
          throw new RateLimitError('Trop de mises à jour. Veuillez attendre une minute.')
        }

        await prisma.ticket.update({
            where: { id: ticketId },
            data: { status: newStatus }
        })
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

// ============================================
// STAFF MANAGEMENT
// ============================================

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
