"use client"
import { useUser } from "@clerk/nextjs";
import Wrapper from "./components/Wrapper";
import { getPendingTicketsByEmail, initUserSession, getMyAssignedPosts } from "./actions";
import { useEffect, useMemo, useState } from "react";
import { Ticket } from "./type";
import TicketComponent from "./components/TicketComponent";
import Link from "next/link";
import { Briefcase } from "lucide-react";

type AssignedPost = {
  id: string
  name: string
  companyId: string
  serviceId: string
  createdAt: string
}

export default function Home() {
  const { user, isLoaded } = useUser()
  const email = user?.primaryEmailAddress?.emailAddress
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [userRole, setUserRole] = useState<'OWNER' | 'ADMIN' | 'STAFF' | null>(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [assignedPosts, setAssignedPosts] = useState<AssignedPost[]>([])
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

  // Fetch user role and assigned posts for STAFF
  useEffect(() => {
    if (!isLoaded) return // Attendre que Clerk charge l'utilisateur
    if (!email) {
      setIsRoleLoading(false) // Non connecté
      return
    }
    const fetchUserData = async () => {
      try {
        setIsRoleLoading(true)
        const { role } = await initUserSession(email, user?.fullName ?? '')
        
        setUserRole(role)
        
        // Si STAFF, récupérer ses postes assignés
        if (role === 'STAFF') {
          const posts = await getMyAssignedPosts()
          setAssignedPosts(posts)
        }
      } catch (error) {
        console.error('[HomePage] Error fetching user data:', error)
      } finally {
        setIsRoleLoading(false)
      }
    }
    fetchUserData()
  }, [email, isLoaded, user?.fullName])

  // Polling every 5 seconds for real-time updates
  useEffect(() => {
    if (!email) return

    setIsLoading(true)
    fetchTickets().finally(() => setIsLoading(false))

    const interval = setInterval(fetchTickets, 5000)
    return () => clearInterval(interval)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  // Attendre que le rôle soit chargé
  if (isRoleLoading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center py-24">
          <span className="loading loading-spinner loading-lg" role="status" aria-label="Chargement"></span>
        </div>
      </Wrapper>
    )
  }

  // Vue spécifique pour STAFF : afficher ses postes assignés
  if (userRole === 'STAFF') {
    return (
      <Wrapper>
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Mes postes assignés</h1>
          <p className="text-base-content/70">Cliquez sur un poste pour gérer les tickets</p>
        </div>

        {assignedPosts.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
            <p className="text-lg text-base-content/70">Aucun poste assigné</p>
            <p className="text-sm text-base-content/50 mt-2">Contactez votre administrateur pour vous assigner des postes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/call/${post.id}`}
                className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer"
              >
                <div className="card-body">
                  <h2 className="card-title">
                    <Briefcase className="w-5 h-5" />
                    {post.name}
                  </h2>
                  <p className="text-sm text-base-content/70">Cliquez pour gérer les tickets</p>
                  <div className="card-actions justify-end mt-4">
                    <button className="btn btn-primary btn-sm">Ouvrir</button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Wrapper>
    )
  }

  // Vue par défaut pour OWNER/ADMIN : dashboard complet
  return (
    <Wrapper>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Tableau de bord - Tous les tickets</h1>
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
