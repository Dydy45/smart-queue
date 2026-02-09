/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Ticket } from '@/app/type';
import Wrapper from "@/app/components/Wrapper";
import EmptyState from "@/app/components/EmptyState";
import TicketComponent from "@/app/components/TicketComponent";
import Link from 'next/link'

const page = ({ params }: { params: Promise<{ idPoste: string }> }) => {
    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress
    const [tickets, setTickets] = useState<Ticket[]>([])

    const [countdown, setCountdown] = useState<number>(5)

  return (
    <Wrapper>

      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Vos tickets</h1>
        <div className="flex items-center">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75"></span>
            <span className="relative inline-flex size-3 rounded-full bg-accent"></span>
          </span>
          <div className="ml-2">
            ({countdown}s)
          </div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div>
          <EmptyState IconComponent={'Bird'} message={'Aucun ticket en attente'} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">

          {
            tickets.map((ticket, index) => {
              const totalWaitTime = tickets
              .slice(0, index)
              .reduce((acc , prevTicket) => acc + prevTicket.avgTime, 0)
              return (
                <TicketComponent 
                key={ticket.id}
                ticket={ticket}
                totalWaitTime={totalWaitTime}
                index={index}
              />
              )
            })
          }

        </div>
      )}
    </Wrapper>
  );
}

export default page
