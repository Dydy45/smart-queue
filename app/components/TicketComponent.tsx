import { Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { Ticket } from '../type';

interface TicketComponentProps {
    ticket: Ticket;
    index?: number;
    totalWaitTime?: number;
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case "IN_PROGRESS":
            return <div className='badge badge-primary'>En cours de traitement</div>
        case "PENDING":
            return <div className='badge badge-warning'>En attente</div>
        case "CALL":
            return <div className='badge badge-info'>C&apos;est votre tour</div>
        case "FINISHED":
            return <div className='badge badge-success'>Servi</div>
        default:
            return <div className='badge badge-primary'>Statut inconnu</div>
    }
}

const getConfidenceBadge = (confidence?: 'none' | 'low' | 'medium' | 'high') => {
    switch (confidence) {
        case 'high':
            return <span className='badge badge-success badge-xs ml-1' title='Estimation fiable (50+ tickets)'>ML</span>
        case 'medium':
            return <span className='badge badge-warning badge-xs ml-1' title='Estimation moyenne (10-49 tickets)'>ML</span>
        case 'low':
            return <span className='badge badge-error badge-outline badge-xs ml-1' title='Peu de données (1-9 tickets)'>~</span>
        default:
            return null
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TicketComponent: React.FC<TicketComponentProps> = ({ ticket, index, totalWaitTime = 0 }) => {

    // Utiliser l'estimation ML si disponible, sinon fallback vers le calcul statique
    const effectiveWaitTime = ticket.estimatedWait ?? totalWaitTime
    const isMLEstimation = ticket.estimatedWait !== undefined && ticket.estimatedWait !== null

    const totalHours = Math.floor(effectiveWaitTime / 60)
    const totalMinutes = effectiveWaitTime % 60
    const formattedTotalWaitTime = `${totalHours}h ${totalMinutes}min`

    const [waitTimeStatus, setWaitTimeStatus] = useState("success")
    const [formattedRealWaitTime, setFormattedRealWaitTime] = useState("")

    useEffect(() => {

        if (!ticket || !ticket.createdAt) return

        const currentTime = new Date().getTime()
        const createdAtTime = new Date(ticket.createdAt).getTime()
        const waitTimeInMinutes = (currentTime - createdAtTime) / 60000

        const hours = Math.floor(waitTimeInMinutes / 60)
        const minutes = Math.floor(waitTimeInMinutes % 60)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormattedRealWaitTime(`${hours}h ${minutes}min`)

        if (effectiveWaitTime !== 0) {
            if (waitTimeInMinutes > effectiveWaitTime) {
                setWaitTimeStatus("error")
            } else {
                setWaitTimeStatus("success")
            }
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticket, effectiveWaitTime])

    return (
        <div className='border p-5 border-base-300 rounded-xl flex flex-col space-y-2'>

            <div className='mx-1 text-lg font-semibold'>
                <span className='text-lg font-semibold text-gray-500 badge'>
                    #{ticket.num}
                </span>
                {ticket.priority === 'APPOINTMENT' && (
                    <span className='badge badge-primary badge-outline ml-2 gap-1'>📅 RDV</span>
                )}
                {ticket.isVirtual && (
                    <span className='badge badge-accent badge-outline ml-2 gap-1'>🌐 Virtuel</span>
                )}
                {ticket.clientDistance && (
                    <span className='badge badge-ghost badge-outline ml-1 gap-1'>📍 {ticket.clientDistance}</span>
                )}
                <span className='font-bold text-xl'>
                    <span className='ml-2'>
                        {ticket?.serviceName}
                    </span>
                    {ticket.avgTime && (
                        <span className='badge badge-primary ml-2'>
                            {ticket.avgTime} min
                        </span>
                    )}
                </span>
            </div>

            <div className='flex flex-col md:flex-row md:justify-between'>
                <div className='flex flex-row btn btn-sm w-fit'>
                    {getStatusBadge(ticket.status)}
                    <div className='lowercase'>
                        {ticket.postName || <Loader className='w-4 h-4 animate-spin' />}
                    </div>
                </div>
                <div className="flex mt-2 md:mt-0">
                    <div className='font-semibold capitalize text-md'>
                        {ticket.nameComplete}
                    </div>
                </div>
            </div>

            {ticket.status !== "IN_PROGRESS" && ticket.status !== "FINISHED" && (
                <div className='border border-base-300 rounded-xl p-5'>
                    <span className='badge badge-warning badge-outline'>Attente</span>
                    <ul className="timeline timeline-vertical lg:timeline-horizontal w-full">

                        {effectiveWaitTime !== 0 && (
                            <li>
                                <div className="timeline-start">
                                    Estimé{isMLEstimation && getConfidenceBadge(ticket.confidence)}
                                </div>
                                <div className="timeline-middle">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className={`h-5 w-5 ${waitTimeStatus === "success" ? "text-green-500" : "text-red-500"}`}>
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                            clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className={`timeline-end timeline-box border-2  ${waitTimeStatus === "success" ? "border-green-500" : "border-red-500"} `}>{formattedTotalWaitTime}</div>
                                <hr className={`${waitTimeStatus === "success" ? "bg-green-500" : "bg-red-500"}`} />
                            </li>
                        )}

                        <li>
                            <hr className={`${waitTimeStatus === "success" ? "bg-green-500" : "bg-red-500"}`} />
                            <div className="timeline-start">Réel</div>
                            <div className="timeline-middle">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className={`h-5 w-5 ${waitTimeStatus === "success" ? "text-green-500" : "text-red-500"}`}>
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                        clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className={`timeline-end timeline-box border-2  ${waitTimeStatus === "success" ? "border-green-500" : "border-red-500"} `}>{formattedRealWaitTime}</div>
                        </li>

                    </ul>

                </div>
            )}
        </div>
    )
}

export default TicketComponent