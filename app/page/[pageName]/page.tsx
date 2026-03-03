/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { createTicket, getServicesByPageName, getTicketsByIds, getTicketsWithContext } from '@/app/actions'
import TicketComponent from '@/app/components/TicketComponent'
import { Service } from '@/app/generated/prisma/client'
import { Ticket } from '@/app/type'
import { useToast } from '@/lib/useToast'


// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { use, useEffect, useState } from 'react'

const page = ({ params }: { params: Promise<{ pageName: string }> }) => {
  const { showError, showSuccess } = useToast()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [pageName, setPageName] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [nameComplete, setNameComplete] = useState<string>("")
  const [ticketNums, setTicketNums] = useState<any[]>([])
  const [countdown, setCountdown] = useState<number>(5)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(true)


  const resolveParamsAndFetchServices = async () => {
    setIsLoadingServices(true)
    try {
      const resolvedParams = await params
      setPageName(resolvedParams.pageName)
      const servicesList = await getServicesByPageName(resolvedParams.pageName)
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

      const validTickets = clientTickets?.filter(ticket => ticket.status !== "FINISHED")
      const validTicketNums = validTickets?.map(ticket => ticket.num)
      localStorage.setItem('ticketNums', JSON.stringify(validTicketNums))

      if (validTickets) {
        setTickets(validTickets)
        setAllTickets(allPendingTickets)
        showSuccess('Tickets mis à jour')
      }

    } catch (error) {
      console.error(error)
      // Fallback à l'ancienne fonction si quelque chose se passe mal
      try {
        const fetchedTickets = await getTicketsByIds(ticketNums)
        const validTickets = fetchedTickets?.filter(ticket => ticket.status !== "FINISHED")
        const validTicketNums = validTickets?.map(ticket => ticket.num)
        localStorage.setItem('ticketNums', JSON.stringify(validTicketNums))
        if (validTickets)
          setTickets(validTickets)
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
      const ticketNum = await createTicket(selectedServiceId, nameComplete, pageName || '')
      if (ticketNum) {
        setSelectedServiceId(null)
        setNameComplete("")
        const updatedTicketNums = [...ticketNums, ticketNum];
        setTicketNums(updatedTicketNums)
        localStorage.setItem("ticketNums", JSON.stringify(updatedTicketNums))
        showSuccess(`Ticket ${ticketNum} créé avec succès!`)
      }
      console.log(ticketNums)
      console.log(ticketNum)

    } catch (error) {
      console.error(error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du ticket'
      showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    const handleCountdownAndRefresh = () => {
      if (countdown === 0) {
        if (ticketNums.length > 0)
          fetchTicketsByIds(ticketNums)
        setCountdown(5)
      } else {
        setCountdown((prevCountdown) => prevCountdown - 1)
      }
    }
    const timeoutId = setTimeout(handleCountdownAndRefresh, 1000)
    return () => clearTimeout(timeoutId)
  }, [countdown , ticketNums])





  return (
    <div className='px-5 md:px-[10%] mt-8 mb-10'>

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
          />
          <button 
            type="submit" 
            className='btn btn-primary w-fit'
            disabled={isLoading || isLoadingServices}
          >
            {isLoading ? (
              <>
                <span className='loading loading-spinner loading-sm'></span>
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
                <div className="flex items-center">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning/30 opacity-75"></span>
                    <span className="relative inline-flex size-3 rounded-full bg-warning"></span>
                  </span>
                  <div className="ml-2">
                    ({countdown}s)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">

                {tickets.map((ticket, index) => {
                  // Utiliser allTickets pour calculer le temps d'attente correct
                  // en tenant compte de TOUS les tickets en attente, pas seulement ceux du client
                  const totalWaitTime = allTickets && allTickets.length > 0
                    ? allTickets
                        .filter(t => t.createdAt < ticket.createdAt && t.serviceId === ticket.serviceId)
                        .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)
                    : tickets
                        .slice(0, index)
                        .reduce((acc, prevTicket) => acc + prevTicket.avgTime, 0)

                  return (
                    <TicketComponent
                      key={ticket.id}
                      ticket={ticket}
                      totalWaitTime={totalWaitTime}
                      index={index}
                    />
                  )
                })}

              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}

export default page