"use client"
/* eslint-disable react-hooks/rules-of-hooks */
import { createTicket, getServicesByPageName, getTicketsByIds } from '@/app/actions'
import EmptyState from '@/app/components/EmptyState'
import TicketComponent from '@/app/components/TicketComponent'
import { Service } from '@/app/generated/prisma/client'
import { Ticket } from '@/app/type'

import { useState, useEffect } from 'react'


const page = ({params} : {params: Promise<{pageName: string}>}) => {

  const [pageName, setPageName] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [nameComplete, setNameComplete] = useState<string>("")
  const [ticketNums, setTicketNums] = useState<unknown[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])

    const resolveParamsAndFetchServices = async () => {
      try {
        const resolvedParams = await params
        setPageName(resolvedParams.pageName)
        const servicesList = await getServicesByPageName(resolvedParams.pageName)
        if (servicesList) {
          setServices(servicesList)
        }
      } catch (error) {
        console.error(error)
      }
    }

    useEffect(() =>{
      resolveParamsAndFetchServices()

      const savedTicketNums = JSON.parse(localStorage.getItem('ticketNums') || '[]')
      setTicketNums(savedTicketNums)

      if(savedTicketNums.lenght > 0) {
        fetchTicketsByIds(savedTicketNums)
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchTicketsByIds = async (ticketNums : any[]) => {
      try {
        const fetchedTickets = await getTicketsByIds(ticketNums)
        const validTickets = fetchedTickets?.filter(ticket => ticket.status !== "FINISHED")
        const validTicketNums = validTickets?.map(Ticket => Ticket.num)
        
        localStorage.setItem('ticketNums' , JSON.stringify(validTicketNums))
        if(validTickets)
          setTickets(validTickets)

      } catch (error) {
        console.error(error)
      }
    }

    const handleSubmit = async (e:React.FormEvent) => {
      e.preventDefault()
      if(!selectedServiceId || !nameComplete){
        alert("Veuillez selectionner un service et entrer votre nom.");
        return
      }
      try {
        const ticketNum = await createTicket(selectedServiceId, nameComplete, pageName || '')
        setSelectedServiceId(null)
        setNameComplete("")
        const updatedTicketNums = [...ticketNums , ticketNum]
        setTicketNums(updatedTicketNums)
        localStorage.setItem("TicketNums", JSON.stringify(updatedTicketNums))

        console.log(ticketNums)

      } catch (error) {
        console.error(error)
      }
    }

  return (
    <div className='px-5 md:px-[10%] mt-8 mb-10'>
      <div className=''>
        <h1 className='text-2xl font-bold'>Bienvenue sur <span className='badge badge-primary ml-2'>@{pageName}</span></h1>
        <p className='text-md'>Créez votre ticket</p>
      </div>
      <div className='flex flex-col md:flex-row w-full mt-4'>

        <form className='flex flex-col space-y-2 md:w-96' onSubmit={handleSubmit}>
          <select 
            className="select select-bordered w-full"
            onChange={(e) => setSelectedServiceId(e.target.value)}
            value={selectedServiceId || ''}
          >
            <option disabled value="">Choisissez un service</option>
            {services.map((services) => (
              <option key={services.id} value={services.id}>
                {services.name} - ({services.avgTime} min)
              </option>
            ))}
          </select>
          <input
            type='text'
            placeholder='Quel est votre nom ?'
            className='input input-bordered w-full'
            onChange={(e) => setNameComplete(e.target.value)}
            value={nameComplete}
          />
          <button type='submit' className='btn btn-primary w-fit'>Go</button>
        </form>

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

      </div>
    </div>
  )
}

export default page
