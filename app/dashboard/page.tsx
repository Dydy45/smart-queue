/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useEffect, useState } from 'react'
import Wrapper from '../components/Wrapper'
import { useUser } from '@clerk/nextjs'
import { get10LstFinishedTicketsByEmail, getTicketStatsByEmail } from '../actions'
import { getActiveMaintenanceModes } from '../actions/maintenance'
import prisma from '@/lib/prisma'
import EmptyState from '../components/EmptyState'
import TicketComponent from '../components/TicketComponent'
import { Ticket } from '../type'
import { MaintenanceMode } from '@/app/generated/prisma'

const StatCard = ({ title, value }: { title: string; value: number }) => {
    return (
        <div className='stats  md:w-1/3 border border-base-200'>
            <div className='stat'>
                <div className='stat-title'>{title}</div>
                <div className='stat-value'>{value}</div>
            </div>
        </div>
    )
}

const page = () => {

    const { user } = useUser()
    const email = user?.primaryEmailAddress?.emailAddress
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [maintenanceModes, setMaintenanceModes] = useState<MaintenanceMode[]>([])

    const [stats, setStats] = useState<{
        totalTickets: number;
        resolvedTickets: number;
        pendingTickets: number
    }>({
        totalTickets: 0,
        resolvedTickets: 0,
        pendingTickets: 0
    })

    const fetchTicketsAndStats = async () => {
        if (email) {
            const data = await get10LstFinishedTicketsByEmail(email)
            if (data) {
                setTickets(data)
            }
            const statsData = await getTicketStatsByEmail(email)
            if (statsData) {
                setStats(statsData)
            }

            // Fetch maintenance modes
            try {
                const company = await prisma.company.findUnique({
                    where: { email },
                    select: { id: true }
                })
                if (company) {
                    const modes = await getActiveMaintenanceModes(company.id)
                    setMaintenanceModes(modes || [])
                }
            } catch (error) {
                console.error('[Dashboard] Error fetching maintenance modes:', error)
            }
        }
    }

    useEffect(() => {
        fetchTicketsAndStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email])

    return (
        <Wrapper>
            <h1 className="text-2xl font-bold mb-4">Statistiques</h1>

            <div className='w-full flex flex-col md:flex-row mb-4 gap-4'>
                <StatCard title='Total Tickets' value={stats.totalTickets} />
                <StatCard title='Tickets Résolus' value={stats.resolvedTickets} />
                <StatCard title='Tickets En Attente' value={stats.pendingTickets} />
            </div>

            <h1 className="text-2xl font-bold mb-4">Les 10 derniers Tickets servis</h1>

            {tickets.length === 0 ? (
                <div>
                    <EmptyState
                        message={'Aucun ticket en attente'}
                        IconComponent='Bird'
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">

                    {tickets.map((ticket, index) => {
                        const totalWaitTime = tickets
                            .slice(0, index)
                            .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)
                        const isServiceInMaintenance = maintenanceModes.some(m => m.serviceId === ticket.serviceId)

                        return (
                            <TicketComponent
                                key={ticket.id}
                                ticket={ticket}
                                totalWaitTime={totalWaitTime}
                                index={index}
                                isServiceInMaintenance={isServiceInMaintenance}
                            />
                        )
                    })}

                </div>
            )}

        </Wrapper>
    )
}

export default page