/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import { getLastTicketByEmail, getPostNameById, updateTicketStatus } from '@/app/actions'
import EmptyState from '@/app/components/EmptyState'
import Wrapper from '@/app/components/Wrapper'
import { Ticket } from '@/app/type'
import { useUser } from '@clerk/nextjs'
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/lib/useToast'

const page = ({ params }: { params: Promise<{ idPoste: string }> }) => {

    const { user } = useUser()
    const { showError } = useToast()
    const email = user?.primaryEmailAddress?.emailAddress
    const [idPoste, setIdPoste] = useState<string | null>(null)
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [namePoste, setNamePoste] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [soundEnabled, setSoundEnabled] = useState(false)
    const prevTicketIdRef = useRef<string | null>(null)
    const router = useRouter()

    const playNotificationSound = useCallback(() => {
        try {
            const audioCtx = new AudioContext()
            const oscillator = audioCtx.createOscillator()
            const gainNode = audioCtx.createGain()
            oscillator.connect(gainNode)
            gainNode.connect(audioCtx.destination)
            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
            oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15)
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
            oscillator.start(audioCtx.currentTime)
            oscillator.stop(audioCtx.currentTime + 0.5)
        } catch { /* AudioContext non disponible */ }
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const getData = async () => {
        try {
            if (email) {
                const resolvedParams = await params;
                setIdPoste(resolvedParams.idPoste)
                const data = await getLastTicketByEmail(email, resolvedParams.idPoste)
                if (data) {
                    setTicket(data)
                }

                const postName = await getPostNameById(resolvedParams.idPoste)
                if (postName) {
                    setNamePoste(postName)
                }

            }
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, params])

    // Son quand un nouveau ticket arrive
    useEffect(() => {
        if (ticket && soundEnabled && ticket.id !== prevTicketIdRef.current) {
            playNotificationSound()
        }
        prevTicketIdRef.current = ticket?.id ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticket])

    // Sync state fullscreen avec la touche ESC
    useEffect(() => {
        const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handleChange)
        return () => document.removeEventListener('fullscreenchange', handleChange)
    }, [])

    const handleStatusChange = async (newStatus: string) => {
        if (ticket) {
            setIsLoading(true)
            try {
                await updateTicketStatus(ticket.id, newStatus)
                if (newStatus === "FINISHED") {
                    router.push(`/poste/${idPoste}`)
                } else {
                    getData()
                }
            } catch (error) {
                console.error(error)
                showError('Erreur lors de la mise à jour du ticket')
            } finally {
                setIsLoading(false)
            }
        }
    }

    const statusConfig = {
        CALL:        { label: 'Appelé',      badgeClass: 'badge-warning', borderClass: 'border-warning' },
        IN_PROGRESS: { label: 'En cours',    badgeClass: 'badge-success', borderClass: 'border-success' },
        PENDING:     { label: 'En attente',  badgeClass: 'badge-ghost',   borderClass: 'border-base-300' },
        FINISHED:    { label: 'Terminé',     badgeClass: 'badge-info',    borderClass: 'border-info' },
    }
    const statusStyle = ticket
        ? (statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.PENDING)
        : null

    return (
        <Wrapper>
            {/* En-tête */}
            <div className='flex justify-between items-center mb-6'>
                <div>
                    <h1 className='text-2xl font-bold'>
                        Poste <span className='badge badge-primary'>{namePoste ?? 'aucun poste'}</span>
                    </h1>
                    <Link className='btn mt-2 btn-sm' href={`/poste/${idPoste}`}>← Retour</Link>
                </div>
                <div className='flex items-center gap-2'>
                    <button
                        className={`btn btn-sm btn-ghost btn-circle ${
                            soundEnabled ? 'text-primary' : 'text-base-content/40'
                        }`}
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                        title={soundEnabled ? 'Son activé' : 'Son désactivé'}
                    >
                        {soundEnabled ? <Volume2 className='w-4 h-4' /> : <VolumeX className='w-4 h-4' />}
                    </button>
                    <button
                        className='btn btn-sm btn-ghost btn-circle'
                        onClick={toggleFullscreen}
                        aria-label={isFullscreen ? 'Quitter le plein écran' : 'Mode plein écran'}
                        title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
                    >
                        {isFullscreen ? <Minimize className='w-4 h-4' /> : <Maximize className='w-4 h-4' />}
                    </button>
                </div>
            </div>

            {ticket ? (
                <div>
                    {/* Carte hero - ticket actuel */}
                    <div className={`card border-2 ${statusStyle?.borderClass} bg-base-100 shadow-xl mb-6`}>
                        <div className='card-body'>
                            <div className='flex justify-between items-start'>
                                <div>
                                    <p className='text-xs text-base-content/50 uppercase tracking-widest mb-1'>Ticket actuel</p>
                                    <h2 className='text-7xl font-black text-primary tracking-tight'>{ticket.num}</h2>
                                </div>
                                <span className={`badge badge-lg ${statusStyle?.badgeClass}`}>{statusStyle?.label}</span>
                            </div>
                            <div className='divider my-2'></div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <p className='text-xs text-base-content/50 uppercase tracking-wider'>Client</p>
                                    <p className='text-2xl font-semibold'>{ticket.nameComplete}</p>
                                </div>
                                <div>
                                    <p className='text-xs text-base-content/50 uppercase tracking-wider'>Service</p>
                                    <p className='text-2xl font-semibold'>{ticket.serviceName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='flex space-x-4'>
                        {ticket.status === 'CALL' && (
                            <button
                                className='btn btn-primary btn-outline'
                                onClick={() => handleStatusChange('IN_PROGRESS')}
                                disabled={isLoading}
                                aria-label='Démarrer le traitement du ticket'
                            >
                                {isLoading ? (
                                    <><span className='loading loading-spinner loading-sm' role='status' aria-label='Chargement'></span>Démarrage...</>
                                ) : 'Démarrer le traitement'}
                            </button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                            <button
                                className='btn btn-warning btn-outline'
                                onClick={() => handleStatusChange('FINISHED')}
                                disabled={isLoading}
                                aria-label='Terminer le traitement du ticket'
                            >
                                {isLoading ? (
                                    <><span className='loading loading-spinner loading-sm' role='status' aria-label='Chargement'></span>Finalisation...</>
                                ) : 'Fin du traitement'}
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <EmptyState
                    message='Aucun ticket en attente'
                    IconComponent='UserSearch'
                />
            )}
        </Wrapper>
    )
}

export default page