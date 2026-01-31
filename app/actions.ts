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