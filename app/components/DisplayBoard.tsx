'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Maximize, Minimize, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react'
import { getTicketsForDisplay } from '@/app/actions'

type DisplayTicket = {
  id: string
  num: string
  status: string
  createdAt: string
  postName: string | null
  serviceName: string
}

type DisplayData = {
  companyName: string
  callTickets: DisplayTicket[]
  inProgressTickets: DisplayTicket[]
  pendingTickets: DisplayTicket[]
  totalPending: number
}

interface DisplayBoardProps {
  initialData: DisplayData
  pageName: string
  companyName?: string | null
  logoUrl?: string | null
  primaryColor?: string | null
}

export default function DisplayBoard({ initialData, pageName, companyName: brandName, logoUrl, primaryColor }: DisplayBoardProps) {
  const [data, setData] = useState<DisplayData>(initialData)
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const prevCallIdsRef = useRef<Set<string>>(new Set(initialData.callTickets.map(t => t.id)))
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await getTicketsForDisplay(pageName)
      if (result) {
        // Détecter nouveaux appels pour le son
        const newCallIds = new Set(result.callTickets.map(t => t.id))
        const hasNewCall = result.callTickets.some(t => !prevCallIdsRef.current.has(t.id))

        if (hasNewCall && soundEnabled && audioRef.current) {
          audioRef.current.play().catch(() => {})
        }

        prevCallIdsRef.current = newCallIds
        setData(result)
        setIsConnected(true)
        setLastUpdate(new Date())
      }
    } catch {
      setIsConnected(false)
    }
  }, [pageName, soundEnabled])

  // Polling toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Horloge temps réel
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Wake Lock pour empêcher la mise en veille
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch {
        // Wake Lock non supporté ou refusé
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      wakeLock?.release()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const timeSinceUpdate = Math.round((currentTime.getTime() - lastUpdate.getTime()) / 1000)

  return (
    <div className={`min-h-screen bg-base-300 flex flex-col ${isFullscreen ? 'cursor-none' : ''}`}>
      {/* Audio pour notification */}
      <audio ref={audioRef} src="/sounds/notification.wav" preload="auto" />

      {/* Header */}
      <header
        className="bg-primary text-primary-content px-6 py-4 flex items-center justify-between shadow-lg"
        style={primaryColor ? { backgroundColor: primaryColor } : undefined}
      >
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={brandName || data.companyName} className="h-10 w-auto object-contain rounded" />
          ) : (
            <span className="text-3xl">🏢</span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{brandName || data.companyName}</h1>
            <p className="text-primary-content/70 text-sm">SmartQueue — File d&apos;attente</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Indicateur de connexion */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="flex items-center gap-1 text-sm">
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {timeSinceUpdate < 10 ? 'Temps réel' : `il y a ${timeSinceUpdate}s`}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-error text-sm">
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnecté</span>
              </span>
            )}
          </div>

          {/* Horloge */}
          <time className="text-2xl font-mono font-bold tabular-nums">
            {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </time>

          {/* Contrôles */}
          <div className="flex gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="btn btn-ghost btn-sm btn-circle text-primary-content"
              aria-label={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-sm btn-circle text-primary-content"
              aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 p-6 grid grid-rows-[auto_1fr] gap-6 overflow-hidden">

        {/* Section CALL — Tickets appelés */}
        <section aria-label="Tickets appelés">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔔</span>
            <h2 className="text-xl font-bold text-base-content">Tickets appelés</h2>
            {data.callTickets.length > 0 && (
              <span className="badge badge-primary badge-lg">{data.callTickets.length}</span>
            )}
          </div>

          {data.callTickets.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <p className="text-base-content/50 text-lg">Aucun ticket en cours d&apos;appel</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.callTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="card bg-primary text-primary-content p-6 shadow-xl animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-5xl lg:text-6xl font-extrabold font-mono tracking-wider">
                        #{ticket.num}
                      </p>
                      <p className="text-primary-content/80 text-lg mt-1">
                        {ticket.serviceName}
                      </p>
                    </div>
                    {ticket.postName && (
                      <div className="text-right">
                        <p className="text-sm text-primary-content/70">Dirigez-vous vers</p>
                        <p className="text-3xl font-bold">{ticket.postName}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Grille IN_PROGRESS + PENDING */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">

          {/* Section IN_PROGRESS */}
          <section aria-label="Tickets en cours de traitement">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⏳</span>
              <h2 className="text-xl font-bold text-base-content">En cours</h2>
              {data.inProgressTickets.length > 0 && (
                <span className="badge badge-secondary badge-lg">{data.inProgressTickets.length}</span>
              )}
            </div>

            {data.inProgressTickets.length === 0 ? (
              <div className="card bg-base-200 p-6 text-center">
                <p className="text-base-content/50">Aucun ticket en traitement</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[50vh]">
                {data.inProgressTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="card bg-secondary/10 border border-secondary/30 p-4 flex flex-row items-center justify-between"
                  >
                    <div>
                      <span className="text-2xl lg:text-3xl font-bold font-mono">#{ticket.num}</span>
                      <span className="text-base-content/60 ml-3">{ticket.serviceName}</span>
                    </div>
                    {ticket.postName && (
                      <span className="badge badge-secondary badge-lg">{ticket.postName}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section PENDING */}
          <section aria-label="Prochains tickets">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-bold text-base-content">En attente</h2>
              {data.totalPending > 0 && (
                <span className="badge badge-ghost badge-lg">{data.totalPending}</span>
              )}
            </div>

            {data.pendingTickets.length === 0 ? (
              <div className="card bg-base-200 p-6 text-center">
                <p className="text-base-content/50">Aucun ticket en attente</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[50vh]">
                {data.pendingTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="card bg-base-200 p-3 flex flex-row items-center gap-4"
                  >
                    <span className="text-base-content/40 font-bold text-lg w-8 text-center">
                      {index + 1}
                    </span>
                    <span className="text-xl font-bold font-mono">#{ticket.num}</span>
                    <span className="text-base-content/60">{ticket.serviceName}</span>
                  </div>
                ))}
                {data.totalPending > data.pendingTickets.length && (
                  <p className="text-center text-base-content/40 text-sm mt-2">
                    + {data.totalPending - data.pendingTickets.length} autre(s) en attente
                  </p>
                )}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  )
}
