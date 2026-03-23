'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { MapPin, Clock, Navigation, Users, Share2, Copy, CheckCircle, AlertTriangle, Car, Loader2 } from 'lucide-react'
import { getTicketTracking } from '@/app/actions/tracking'
import { updateClientLocation } from '@/app/actions/virtual-queue'

type TrackingData = {
  ticket: {
    num: string
    status: string
    serviceName: string
    position: number
    createdAt: string
    isVirtual: boolean
  }
  estimatedWaitMinutes: number
  confidence: string
  company: {
    name: string
    latitude: number | null
    longitude: number | null
  }
  totalPending: number
  distance: {
    meters: number
    formatted: string
    travelMinutes: number
  } | null
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <span className="badge badge-warning">En attente</span>
    case 'CALL':
      return <span className="badge badge-info animate-pulse">Appelé !</span>
    case 'IN_PROGRESS':
      return <span className="badge badge-primary">En cours de traitement</span>
    case 'FINISHED':
      return <span className="badge badge-success">Terminé</span>
    default:
      return <span className="badge">{status}</span>
  }
}

function getConfidenceBadge(confidence: string) {
  switch (confidence) {
    case 'high':
      return <span className="badge badge-success badge-xs">Fiable</span>
    case 'medium':
      return <span className="badge badge-warning badge-xs">Moyenne</span>
    case 'low':
      return <span className="badge badge-error badge-xs">Faible</span>
    default:
      return null
  }
}

function getDepartureAdvice(data: TrackingData): { text: string; urgent: boolean } | null {
  if (!data.distance || data.ticket.status !== 'PENDING') return null

  const timeToLeave = data.estimatedWaitMinutes - data.distance.travelMinutes

  if (timeToLeave <= 0) {
    return { text: 'Partez maintenant pour arriver à temps !', urgent: true }
  }
  if (timeToLeave <= 5) {
    return { text: `Préparez-vous à partir dans ~${timeToLeave} min`, urgent: true }
  }
  return { text: `Vous pouvez partir dans ~${timeToLeave} min`, urgent: false }
}

export default function TrackingPage({ params }: { params: Promise<{ trackingToken: string }> }) {
  const { trackingToken } = use(params)
  const [data, setData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [geoEnabled, setGeoEnabled] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const result = await getTicketTracking(trackingToken)
      if (result) {
        setData(result)
        setNotFound(false)
      } else {
        setNotFound(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [trackingToken])

  // Polling toutes les 10s
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Géolocalisation
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée par votre navigateur')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        setGeoEnabled(true)
        setGeoError(null)
        try {
          await updateClientLocation(
            trackingToken,
            position.coords.latitude,
            position.coords.longitude
          )
        } catch {
          // Non-bloquant
        }
      },
      (err) => {
        setGeoEnabled(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Géolocalisation refusée. Activez-la pour un suivi optimal.')
        } else {
          setGeoError('Impossible d\'obtenir votre position')
        }
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [trackingToken])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Chargement du suivi...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl max-w-md mx-4">
          <div className="card-body text-center">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-2" />
            <h2 className="card-title justify-center">Ticket introuvable</h2>
            <p className="text-sm text-gray-500">
              Ce lien de suivi est invalide ou le ticket a été supprimé.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const advice = getDepartureAdvice(data)
  const progressPercent = data.totalPending > 0
    ? Math.max(0, Math.min(100, ((data.totalPending - data.ticket.position) / data.totalPending) * 100))
    : 0

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body pb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{data.company.name}</p>
                <h1 className="text-2xl font-bold">Ticket #{data.ticket.num}</h1>
                <p className="text-sm">{data.ticket.serviceName}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(data.ticket.status)}
                {data.ticket.isVirtual && (
                  <span className="badge badge-accent badge-outline badge-sm">Virtuel</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conseil de départ — affiché en haut si urgent */}
        {advice && (
          <div className={`alert ${advice.urgent ? 'alert-warning' : 'alert-info'}`}>
            <Car className="w-5 h-5" />
            <div>
              <p className="font-bold">{advice.text}</p>
              {data.distance && (
                <p className="text-xs mt-1">
                  Distance : {data.distance.formatted} — Trajet estimé : ~{data.distance.travelMinutes} min
                </p>
              )}
            </div>
          </div>
        )}

        {/* Statut spécial : CALL */}
        {data.ticket.status === 'CALL' && (
          <div className="alert alert-info shadow-lg animate-pulse">
            <div>
              <h3 className="font-bold text-lg">Votre ticket est appelé !</h3>
              <p>Veuillez vous présenter immédiatement.</p>
            </div>
          </div>
        )}

        {/* Statut spécial : FINISHED */}
        {data.ticket.status === 'FINISHED' && (
          <div className="alert alert-success shadow-lg">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Ticket terminé</h3>
              <p className="text-sm">Merci de votre visite !</p>
            </div>
          </div>
        )}

        {/* Position dans la file */}
        {data.ticket.status === 'PENDING' && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Position dans la file</h2>
              </div>

              <div className="text-center mb-3">
                <span className="text-5xl font-bold text-primary">{data.ticket.position}</span>
                <span className="text-lg text-gray-500">/{data.totalPending}</span>
              </div>

              {/* Barre de progression */}
              <div className="w-full">
                <progress
                  className="progress progress-primary w-full"
                  value={progressPercent}
                  max="100"
                  aria-label="Progression dans la file"
                ></progress>
                <p className="text-xs text-center text-gray-400 mt-1">
                  {data.totalPending - data.ticket.position} personne(s) avant vous passée(s)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Temps d'attente estimé */}
        {data.ticket.status === 'PENDING' && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Temps d&apos;attente estimé</h2>
                {getConfidenceBadge(data.confidence)}
              </div>

              <div className="text-center">
                <span className="text-4xl font-bold">~{data.estimatedWaitMinutes}</span>
                <span className="text-lg text-gray-500 ml-1">min</span>
              </div>
            </div>
          </div>
        )}

        {/* Distance & trajet */}
        {data.distance && data.ticket.status === 'PENDING' && (
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Distance</h2>
              </div>

              <div className="stats stats-horizontal w-full">
                <div className="stat px-3 py-2">
                  <div className="stat-title text-xs">Distance</div>
                  <div className="stat-value text-lg">{data.distance.formatted}</div>
                </div>
                <div className="stat px-3 py-2">
                  <div className="stat-title text-xs">Trajet estimé</div>
                  <div className="stat-value text-lg">~{data.distance.travelMinutes} min</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GPS status */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body py-3">
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 ${geoEnabled ? 'text-success' : 'text-gray-400'}`} />
              <span className="text-sm">
                {geoEnabled
                  ? 'GPS actif — Position mise à jour automatiquement'
                  : geoError || 'GPS inactif'
                }
              </span>
              {geoEnabled && (
                <span className="relative flex size-2 ml-auto">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/50"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-success"></span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Partager */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Partager ce lien de suivi</span>
              </div>
              <button
                className="btn btn-sm btn-outline gap-1"
                onClick={handleCopyLink}
                aria-label="Copier le lien"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30 opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-accent"></span>
            </span>
            Mise à jour automatique toutes les 10 secondes
          </div>
        </div>

      </div>
    </div>
  )
}
