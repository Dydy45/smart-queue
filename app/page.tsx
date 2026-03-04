"use client"
import { useUser } from "@clerk/nextjs";
import Wrapper from "./components/Wrapper";
import { getPendingTicketsByEmail } from "./actions";
import { useEffect, useMemo, useState } from "react";
import { Ticket } from "./type";
import TicketComponent from "./components/TicketComponent";

export default function Home() {
  const {user} = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const TICKETS_PER_PAGE = 10

  const totalPages = Math.ceil(tickets.length / TICKETS_PER_PAGE)
  const paginatedTickets = useMemo(() =>
    tickets.slice((currentPage - 1) * TICKETS_PER_PAGE, currentPage * TICKETS_PER_PAGE),
    [tickets, currentPage]
  )

  const fetchTickets = async () => {
    if(email) {
      try {
        const fetchedTickets = await getPendingTicketsByEmail(email);
        if(fetchedTickets) {
          setTickets(fetchedTickets)
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  // Polling every 5 seconds for real-time updates
  useEffect(() => {
    if (!email) return

    setIsLoading(true)
    fetchTickets().finally(() => setIsLoading(false))

    const interval = setInterval(fetchTickets, 5000)
    return () => clearInterval(interval)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  return (
    <Wrapper>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vos tickets</h1>
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className='loading loading-spinner loading-sm' role="status" aria-label="Chargement des tickets"></span>
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

          {paginatedTickets.map((ticket) => {
            const actualIndex = tickets.findIndex(t => t.id === ticket.id)
            const totalWaitTime = tickets
              .slice(0, actualIndex)
              .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)
            return (
              <TicketComponent
                key={ticket.id}
                ticket={ticket}
                totalWaitTime={totalWaitTime}
                index={actualIndex}
              />
            )
          })}

        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              aria-label="Page précédente"
            >
              ←
            </button>
            <span className="text-sm text-base-content/70">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
            >
              →
            </button>
          </div>
        )}
    </Wrapper>
  );
}
