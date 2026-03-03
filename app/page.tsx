"use client"
import { useUser } from "@clerk/nextjs";
import Wrapper from "./components/Wrapper";
import { getPendingTicketsByEmail } from "./actions";
import { useEffect, useState } from "react";
import { Ticket } from "./type";
import EmptyState from "./components/EmptyState";
import TicketComponent from "./components/TicketComponent";
import { useToast } from "@/lib/useToast";
import socket from "@/lib/socket";

export default function Home() {
  const {user} = useUser()
  const { showError } = useToast()
  const email = user?.primaryEmailAddress?.emailAddress
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTickets = async () => {
    if(email) {
      setIsLoading(true)
      try {
        const fetchedTickets = await getPendingTicketsByEmail(email);
        if(fetchedTickets) {
          setTickets(fetchedTickets)
        }
      } catch (error) {
        console.error(error)
        showError('Erreur lors de la récupération des tickets')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // WebSocket connection for real-time updates
  useEffect (() => {
    if(!email) return

    // Emit login event to server
    socket.emit('login', email)

    // Listen for ticket updates from server
    const handleTicketsUpdated = (updatedTickets: Ticket[]) => {
      setTickets(updatedTickets)
    }

    socket.on('ticketsUpdated', handleTicketsUpdated)

    // Fetch initial tickets
    fetchTickets()

    // Cleanup listeners on unmount
    return () => {
      socket.off('ticketsUpdated', handleTicketsUpdated)
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  } , [email])

  return (
    <Wrapper>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vos tickets</h1>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className='loading loading-spinner loading-sm'></span>
          )}
          {!isLoading && (
            <>
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75"></span>
                <span className="relative inline-flex size-3 rounded-full bg-accent"></span>
              </span>
              <span className="text-sm text-base-content/70">Connecté</span>
            </>
          )}
        </div>
      </div>
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
    </Wrapper>
  );
}
