/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { getPendingTicketsByEmail, getPostNameById } from "@/app/actions"
import { getTodayAppointments } from "@/app/actions/appointments"
import EmptyState from "@/app/components/EmptyState"
import TicketComponent from "@/app/components/TicketComponent"
import Wrapper from "@/app/components/Wrapper"
import { Ticket } from "@/app/type"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { CalendarClock } from "lucide-react"
import { useState, useEffect } from "react"

type UpcomingAppointment = {
  id: string
  clientName: string
  appointmentDate: string
  duration: number
  serviceName: string
  status: string
  hasTicket: boolean
}


const page = ({ params }: { params: Promise<{ idPoste: string }> }) => {
    const {user} = useUser()
    const email = user?.primaryEmailAddress?.emailAddress
    const [tickets, setTickets] = useState<Ticket[]>([])

    const [countdown, setCountdown] = useState<number>(5)

    const [idPoste, setIdPoste] = useState< string | null > (null)
    const [namePoste, setNamePoste] = useState< string | null > (null)
    const [todayAppointments, setTodayAppointments] = useState<UpcomingAppointment[]>([])

    const fetchTickets = async () => {
        if(email) {
          try {
            const fetchedTickets = await getPendingTicketsByEmail(email);
            if(fetchedTickets) {
              setTickets(fetchedTickets)
            }
            // Charger aussi les RDV du jour
            const { upcoming } = await getTodayAppointments()
            setTodayAppointments(upcoming)
          } catch (error) {
            console.error(error)
          }
        }
      }
    
      useEffect (() => {
        fetchTickets()
      } , [email])

    useEffect (() => {
        const handleCountdownAndRefresh = () => {
          if(countdown === 0){
            fetchTickets()
            setCountdown(5)
          }else {
            setCountdown((prevCountdown) => prevCountdown - 1)
          }
        }
    
        const timeoutId = setTimeout(handleCountdownAndRefresh, 1000)
    
        return () => clearTimeout(timeoutId)
      } , [countdown])

      const getPosteName = async () => {
        try {
          const resolvedParams = await params;
          setIdPoste(resolvedParams.idPoste)

          const posteName = await getPostNameById(resolvedParams.idPoste)
          if(posteName) {
            setNamePoste(posteName)
          }
        } catch (error) {
          console.error(error)
        }
      }

      useEffect (() => {
        getPosteName()
      } , [params])

  return (
    <Wrapper>

      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold"><span>Poste</span> <span className="badge badge-primary">{namePoste ?? "Aucun poste"}</span></h1>
        <div className="flex items-center">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75"></span>
            <span className="relative inline-flex size-3 rounded-full bg-accent"></span>
          </span>
          <div className="ml-2">
            ({countdown}s)
          </div>
          <Link href={`/call/${idPoste}`} className={`ml-4 btn btn-sm ${!namePoste && "btn-disabled"}`}>
            Appeler le suivant
          </Link>
        </div>
      </div>

      {/* RDV du jour */}
      {todayAppointments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <CalendarClock className="w-5 h-5 text-primary" />
            Rendez-vous du jour
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {todayAppointments.map((apt) => {
              const aptDate = new Date(apt.appointmentDate)
              const now = new Date()
              const diffMin = (aptDate.getTime() - now.getTime()) / (60 * 1000)
              const isNow = diffMin >= -15 && diffMin <= 15
              const isSoon = diffMin > 15 && diffMin <= 60

              return (
                <div
                  key={apt.id}
                  className={`card card-compact border ${
                    apt.hasTicket
                      ? 'border-success/40 bg-success/5'
                      : isNow
                        ? 'border-warning/60 bg-warning/10 animate-pulse'
                        : isSoon
                          ? 'border-info/40 bg-info/5'
                          : 'border-base-300 bg-base-100'
                  }`}
                >
                  <div className="card-body flex-row items-center justify-between py-2 px-4">
                    <div>
                      <span className="font-semibold">{apt.clientName}</span>
                      <span className="text-xs text-base-content/60 ml-2">
                        {apt.serviceName} · {apt.duration} min
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">
                        {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {apt.hasTicket ? (
                        <span className="badge badge-success badge-sm">Check-in ✓</span>
                      ) : isNow ? (
                        <span className="badge badge-warning badge-sm">Maintenant</span>
                      ) : isSoon ? (
                        <span className="badge badge-info badge-sm">Bientôt</span>
                      ) : (
                        <span className="badge badge-ghost badge-sm">À venir</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
  )
}

export default page
