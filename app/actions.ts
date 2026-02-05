"use server"

import prisma from '@/lib/prisma'

export async function checkAndAddUser(email: string, name: string) {
    if (!email) return
    try {
        const existingUser = await prisma.company.findUnique({
            where: { email: email }
        })
        if (!existingUser && name) {
            await prisma.company.create({
                data: { email, name }
            })
        }
    } catch (error) {
        console.error("Error in checkAndAddUser:", error)
    }
}

export async function createService(email: string, serviceName: string, avgTime: number) {
    if (!email || !serviceName || avgTime == null) return
    try {
        const existingCompany = await prisma.company.findUnique({
            where: { email: email }
        })
        if (existingCompany) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const newService = await prisma.service.create({
                data: {
                    name: serviceName,
                    avgTime: avgTime,
                    companyId: existingCompany.id
                }
            })
        } else {
            console.error("Company not found for email:", email)
        }
    } catch (error) {
        console.error("Error in createService:", error)
    }
}

export async function getServiceByEmail(email: string) {
    if (!email) return 
    try {
        const company = await prisma.company.findUnique({
            where: { email: email }
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const service = await prisma.service.findUnique({
            where: { id: serviceId }
        })

        await prisma.service.delete({
            where: { id: serviceId }
        })
    } catch (error) {
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const company = await prisma.company.findUnique({
            where: {
                email: email
            }
        })
        await prisma.company.update({
            where: { email },
            data: { pageName }
        })
    } catch (error) {
        console.error(error)
    }

}

export async function getServicesByPageName(pageName: string) {
    try {
        const company = await prisma.company.findUnique({
            where: {
                pageName: pageName
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée avec le nom de page : ${pageName}`)
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
        const company = await prisma.company.findUnique({
            where: {
                pageName: pageName
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée avec le nom de page : ${pageName}`)
        }

        const ticketNum = `A${Math.floor(Math.random() * 10000)}`

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const ticket = await prisma.ticket.create({
            data: {
                serviceId,
                nameComplete,
                num : ticketNum,
                status:"PENDING"
            }
        })

        return ticketNum

    } catch (error) {
        console.error(error)
    }
}

export async function getPendingTicketsByEmail(email:string) {
    try {
      const company = await prisma.company.findUnique({
            where: {
                email: email
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
                            include: {
                                post: true
                            }
                        }
                    }
                }
            }
        })

        if(!company) {
            throw new Error(`Aucune entreprise trouvée avec le nom de page : ${email}`)
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