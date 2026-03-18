/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { createTicket, getServicesByPageName, getTicketsByIds, getTicketsWithContext } from '@/app/actions'
import TicketComponent from '@/app/components/TicketComponent'
import FeedbackModal from '@/app/components/FeedbackModal'
import CompanyThemeProvider from '@/app/components/CompanyThemeProvider'
import { getCompanyTheme } from '@/app/actions/theme'
import { Service } from '@/app/generated/prisma/client'
import { Ticket } from '@/app/type'
import { useToast } from '@/lib/useToast'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { use, useEffect, useMemo, useRef, useState } from 'react'

const page = ({ params }: { params: Promise<{ pageName: string }> }) => {
  const { showError, showSuccess } = useToast()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [pageName, setPageName] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [nameComplete, setNameComplete] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [whatsappConsent, setWhatsappConsent] = useState(false)
  const [ticketNums, setTicketNums] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [finishedTickets, setFinishedTickets] = useState<Ticket[]>([])
  const [feedbackTicket, setFeedbackTicket] = useState<Ticket | null>(null)
  const [theme, setTheme] = useState<{ name: string; logoUrl: string | null; primaryColor: string; accentColor: string; description: string | null } | null>(null)
  const TICKETS_PER_PAGE = 5

  const totalPages = Math.ceil(tickets.length / TICKETS_PER_PAGE)
  const paginatedTickets = useMemo(() =>
    tickets.slice((currentPage - 1) * TICKETS_PER_PAGE, currentPage * TICKETS_PER_PAGE),
    [tickets, currentPage]
  )

  const resolveParamsAndFetchServices = async () => {
    setIsLoadingServices(true)
    try {
      const resolvedParams = await params
      setPageName(resolvedParams.pageName)
      const [servicesList, themeData] = await Promise.all([
        getServicesByPageName(resolvedParams.pageName),
        getCompanyTheme(resolvedParams.pageName),
      ])
      if (themeData) setTheme(themeData)
      if (servicesList) {
        setServices(servicesList)
        showSuccess(`${servicesList.length} service(s) chargé(s) avec succès`)
      } else {
        showError('Aucun service trouvé pour cette page')
      }
    } catch (error) {
      console.error(error)
      showError(error instanceof Error ? error.message : 'Erreur lors du chargement des services')
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Keep ref in sync with current ticketNums for use in polling interval
  const ticketNumsRef = useRef<any[]>([])
  useEffect(() => {
    ticketNumsRef.current = ticketNums
  }, [ticketNums])

  // Poll every 5 seconds for real-time ticket status updates
  useEffect(() => {
    if (!pageName) return
    const interval = setInterval(() => {
      if (ticketNumsRef.current.length > 0) {
        fetchTicketsByIds(ticketNumsRef.current)
      }
    }, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageName])

  useEffect(() => {
    resolveParamsAndFetchServices()

    const ticketNumsFromStorage = localStorage.getItem('ticketNums')

    if (ticketNumsFromStorage && ticketNumsFromStorage !== "undefined" ) {
      const savedTicketNums = JSON.parse(ticketNumsFromStorage)
      setTicketNums(savedTicketNums)
      if (savedTicketNums.length > 0) {
        fetchTicketsByIds(savedTicketNums)
      }
    } else {
      setTicketNums([])
    }


  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTicketsByIds = async (ticketNums: any[]) => {
    try {
      // Utiliser la nouvelle fonction pour avoir le contexte complet
      const { clientTickets, allTickets: allPendingTickets } = await getTicketsWithContext(ticketNums, pageName || '')

      const activeTickets = clientTickets?.filter(ticket => ticket.status !== "FINISHED") || []
      const newlyFinished = clientTickets?.filter(ticket => ticket.status === "FINISHED") || []

      // Garder les tickets terminés en attente de feedback
      if (newlyFinished.length > 0) {
        setFinishedTickets(prev => {
          const existingIds = new Set(prev.map(t => t.id))
          const newOnes = newlyFinished.filter(t => !existingIds.has(t.id))
          return [...prev, ...newOnes]
        })
      }

      const validTicketNums = activeTickets.map(ticket => ticket.num)
      localStorage.setItem('ticketNums', JSON.stringify(validTicketNums))

      setTickets(activeTickets)
      setAllTickets(allPendingTickets)

    } catch (error) {
      console.error(error)
      // Fallback à l'ancienne fonction si quelque chose se passe mal
      try {
        const fetchedTickets = await getTicketsByIds(ticketNums)
        const activeTickets = fetchedTickets?.filter(ticket => ticket.status !== "FINISHED") || []
        const validTicketNums = activeTickets.map(ticket => ticket.num)
        localStorage.setItem('ticketNums', JSON.stringify(validTicketNums))
        setTickets(activeTickets)
      } catch (fallbackError) {
        console.error(fallbackError)
        showError('Erreur lors de la synchronisation des tickets')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceId || !nameComplete) {
      showError("Veuillez sélectionner un service et entrer votre nom.")
      return
    }
    setIsLoading(true)
    try {
      const ticketNum = await createTicket(
          selectedServiceId,
          nameComplete,
          pageName || '',
          whatsappConsent ? phoneNumber : undefined,
          whatsappConsent || undefined,
        )
      if (ticketNum) {
        setSelectedServiceId(null)
        setNameComplete("")
        setPhoneNumber("")
        setWhatsappConsent(false)
        const updatedTicketNums = [...ticketNums, ticketNum];
        setTicketNums(updatedTicketNums)
        localStorage.setItem("ticketNums", JSON.stringify(updatedTicketNums))
        showSuccess(`Ticket ${ticketNum} créé avec succès!`)
        // Fetch the newly created ticket to display it immediately
        await fetchTicketsByIds(updatedTicketNums)
      }

    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du ticket'
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='px-5 md:px-[10%] mt-8 mb-10'>
      <CompanyThemeProvider
        primaryColor={theme?.primaryColor}
        accentColor={theme?.accentColor}
        logoUrl={theme?.logoUrl}
        companyName={theme?.name}
        description={theme?.description}
      >

      <div>
        <h1 className='text-2xl font-bold'>
          Bienvenu sur
          <span className='badge badge-primary ml-2'>@{pageName}</span>
        </h1>
        <p className='text-md'>Aller , créer votre ticket</p>
      </div>

      <div className='flex flex-col md:flex-row w-full mt-4'>

        <form className='flex flex-col space-y-2 md:w-96' onSubmit={handleSubmit}>
          <select
            className="select select-bordered w-full"
            onChange={(e) => setSelectedServiceId(e.target.value)}
            value={selectedServiceId || ''}
            disabled={isLoading || isLoadingServices}
            aria-label="Choisir un service"
          >
            <option disabled value="">
              {isLoadingServices ? '⏳ Chargement des services...' : 'Choisissez un service'}
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} - ({service.avgTime} min)
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder='Quel est votre nom ?'
            className='input input-bordered w-full'
            onChange={(e) => setNameComplete(e.target.value)}
            value={nameComplete}
            disabled={isLoading}
            aria-label="Votre nom"
          />

          {/* WhatsApp notification opt-in */}
          <div className="bg-base-200 rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={whatsappConsent}
                onChange={(e) => setWhatsappConsent(e.target.checked)}
                disabled={isLoading}
              />
              <span className="text-sm">
                Recevoir une notification WhatsApp quand mon tour approche
              </span>
            </label>
            {whatsappConsent && (
              <input
                type="tel"
                placeholder="Numéro WhatsApp (ex: +33612345678)"
                className="input input-bordered input-sm w-full"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                aria-label="Numéro WhatsApp"
              />
            )}
          </div>

          <button 
            type="submit" 
            className='btn btn-primary w-fit'
            disabled={isLoading || isLoadingServices}
          >
            {isLoading ? (
              <>
                <span className='loading loading-spinner loading-sm' role="status" aria-label="Chargement"></span>
                Création...
              </>
            ) : (
              'Go'
            )}
          </button>
        </form>

        <div className='w-full mt-4 md:ml-4 md:mt-0'>

          {tickets.length !== 0 && (

            <div>
              <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold">Vos Tickets</h1>
                <div className="flex items-center gap-2">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75"></span>
                    <span className="relative inline-flex size-3 rounded-full bg-accent"></span>
                  </span>
                  <span className="text-sm text-base-content/70">Auto-actualisation</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">

                {paginatedTickets.map((ticket) => {
                  const actualIndex = tickets.findIndex(t => t.id === ticket.id)
                  const totalWaitTime = allTickets && allTickets.length > 0
                    ? allTickets
                        .filter(t => t.createdAt < ticket.createdAt && t.serviceId === ticket.serviceId)
                        .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)
                    : tickets
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
                <div className="flex justify-center items-center gap-3 mt-4">
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
            </div>
          )}

          {/* Tickets terminés en attente de feedback */}
          {finishedTickets.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold mb-3">Donnez votre avis</h2>
              <div className="grid grid-cols-1 gap-3">
                {finishedTickets.map((ticket) => (
                  <div key={ticket.id} className="card bg-base-200 p-4 flex flex-row items-center justify-between">
                    <div>
                      <span className="font-mono font-bold">#{ticket.num}</span>
                      <span className="text-sm text-base-content/60 ml-2">{ticket.nameComplete}</span>
                      <span className="badge badge-success badge-sm ml-2">Terminé</span>
                    </div>
                    <button
                      onClick={() => setFeedbackTicket(ticket)}
                      className="btn btn-primary btn-sm gap-1"
                    >
                      ⭐ Donner mon avis
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal de feedback */}
      {feedbackTicket && (
        <FeedbackModal
          ticketId={feedbackTicket.id}
          ticketNumber={feedbackTicket.num}
          isOpen={!!feedbackTicket}
          onClose={() => {
            setFinishedTickets(prev => prev.filter(t => t.id !== feedbackTicket.id))
            setFeedbackTicket(null)
          }}
        />
      )}

      </CompanyThemeProvider>
    </div>
  )
}

export default page

