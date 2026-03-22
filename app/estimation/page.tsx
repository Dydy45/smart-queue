'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Wrapper from '../components/Wrapper'
import EmptyState from '../components/EmptyState'
import { getEstimationDashboard, syncAvgTimeWithHistory } from '../actions/estimation'
import { Loader, RefreshCw, ArrowRightLeft, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import type { ServiceEstimationStats } from '@/lib/wait-time-estimator'

export default function EstimationPage() {
  const { isLoaded } = useUser()
  const [services, setServices] = useState<ServiceEstimationStats[]>([])
  const [globalAccuracy, setGlobalAccuracy] = useState(0)
  const [totalSampleSize, setTotalSampleSize] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [syncingServiceId, setSyncingServiceId] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await getEstimationDashboard()
      if (data) {
        setServices(data.services)
        setGlobalAccuracy(data.globalAccuracy)
        setTotalSampleSize(data.totalSampleSize)
      }
    } catch (error) {
      console.error('[Estimation] Erreur chargement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded) fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  const handleSync = async (serviceId: string) => {
    setSyncingServiceId(serviceId)
    try {
      const result = await syncAvgTimeWithHistory(serviceId)
      if (result.success) {
        await fetchData()
      } else {
        console.error('[Estimation] Sync error:', result.error)
      }
    } catch (error) {
      console.error('[Estimation] Sync error:', error)
    } finally {
      setSyncingServiceId(null)
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="badge badge-success gap-1">Élevée</span>
      case 'medium':
        return <span className="badge badge-warning gap-1">Moyenne</span>
      case 'low':
        return <span className="badge badge-error badge-outline gap-1">Faible</span>
      default:
        return <span className="badge badge-ghost gap-1">Aucune donnée</span>
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-success'
    if (accuracy >= 0.6) return 'text-warning'
    return 'text-error'
  }

  const getDriftBadge = (configured: number, actual: number) => {
    if (actual === 0) return null
    const drift = Math.abs(configured - actual) / actual
    if (drift > 0.3) return <span className="badge badge-error badge-sm">Écart &gt;30%</span>
    if (drift > 0.15) return <span className="badge badge-warning badge-sm">Écart &gt;15%</span>
    return <span className="badge badge-success badge-sm">OK</span>
  }

  const formatPeakHours = (hours: number[]) => {
    if (hours.length === 0) return '—'
    return hours.map(h => `${h}h`).join(', ')
  }

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Estimations Intelligentes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Prédictions basées sur l&apos;historique réel des tickets (EWMA)
          </p>
        </div>
        <button
          className="btn btn-sm btn-outline gap-2"
          onClick={fetchData}
          aria-label="Rafraîchir les données"
        >
          <RefreshCw className="w-4 h-4" />
          Rafraîchir
        </button>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat border border-base-300 rounded-xl">
          <div className="stat-figure text-primary">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="stat-title">Précision globale</div>
          <div className={`stat-value ${getAccuracyColor(globalAccuracy)}`}>
            {totalSampleSize > 0 ? `${Math.round(globalAccuracy * 100)}%` : '—'}
          </div>
          <div className="stat-desc">
            {totalSampleSize > 0 ? `Sur ${totalSampleSize} tickets analysés` : 'Pas encore de données'}
          </div>
        </div>

        <div className="stat border border-base-300 rounded-xl">
          <div className="stat-figure text-primary">
            <Clock className="w-8 h-8" />
          </div>
          <div className="stat-title">Services analysés</div>
          <div className="stat-value">{services.length}</div>
          <div className="stat-desc">
            {services.filter(s => s.confidence === 'high').length} avec confiance élevée
          </div>
        </div>

        <div className="stat border border-base-300 rounded-xl">
          <div className="stat-figure text-primary">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <div className="stat-title">Algorithme</div>
          <div className="stat-value text-lg">EWMA</div>
          <div className="stat-desc">Moyenne pondérée glissante + contexte horaire</div>
        </div>
      </div>

      {/* Tableau des services */}
      {services.length === 0 ? (
        <EmptyState
          message="Aucun service configuré"
          IconComponent="Bird"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full" aria-label="Tableau des estimations par service">
            <thead>
              <tr>
                <th>Service</th>
                <th>avgTime configuré</th>
                <th>Durée réelle moy.</th>
                <th>Estimation ML</th>
                <th>Écart</th>
                <th>Confiance</th>
                <th>Précision</th>
                <th>Échantillons</th>
                <th>Heures de pointe</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.serviceId}>
                  <td className="font-semibold">{service.serviceName}</td>
                  <td>
                    <span className="badge badge-outline">{service.configuredAvgTime} min</span>
                  </td>
                  <td>
                    {service.actualAvgDuration > 0
                      ? <span className="font-mono">{service.actualAvgDuration} min</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td>
                    <span className="font-mono font-semibold">{service.estimatedDuration} min</span>
                  </td>
                  <td>
                    {getDriftBadge(service.configuredAvgTime, service.actualAvgDuration)}
                  </td>
                  <td>{getConfidenceBadge(service.confidence)}</td>
                  <td>
                    {service.accuracy.sampleSize > 0 ? (
                      <span className={`font-semibold ${getAccuracyColor(service.accuracy.accuracy)}`}>
                        {Math.round(service.accuracy.accuracy * 100)}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-ghost">{service.sampleSize}</span>
                  </td>
                  <td className="text-sm">
                    {formatPeakHours(service.peakHours)}
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-primary gap-1"
                      onClick={() => handleSync(service.serviceId)}
                      disabled={
                        syncingServiceId === service.serviceId ||
                        service.confidence === 'none'
                      }
                      title="Synchroniser avgTime avec la durée réelle mesurée"
                      aria-label={`Synchroniser avgTime pour ${service.serviceName}`}
                    >
                      {syncingServiceId === service.serviceId ? (
                        <Loader className="w-3 h-3 animate-spin" />
                      ) : (
                        <ArrowRightLeft className="w-3 h-3" />
                      )}
                      Sync
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Légende */}
      <div className="mt-8 border border-base-300 rounded-xl p-5">
        <h2 className="font-semibold mb-3">Comment ça fonctionne ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-1">Niveaux de confiance</h3>
            <ul className="space-y-1">
              <li><span className="badge badge-success badge-xs mr-2">ML</span> <strong>Élevée</strong> — 50+ tickets, EWMA + contexte horaire</li>
              <li><span className="badge badge-warning badge-xs mr-2">ML</span> <strong>Moyenne</strong> — 10-49 tickets, EWMA simple</li>
              <li><span className="badge badge-error badge-outline badge-xs mr-2">~</span> <strong>Faible</strong> — 1-9 tickets, moyenne simple</li>
              <li><span className="badge badge-ghost badge-xs mr-2">—</span> <strong>Aucune</strong> — Fallback vers avgTime configuré</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-1">Bouton &quot;Sync&quot;</h3>
            <p>Met à jour le <code className="badge badge-outline badge-xs">avgTime</code> du service avec la durée réellement mesurée par le moteur ML. Utile si l&apos;estimation manuelle initiale est trop éloignée de la réalité.</p>
            <h3 className="font-medium mt-3 mb-1">Heures de pointe</h3>
            <p>Détectées automatiquement quand le volume de tickets dépasse 30% de la moyenne horaire sur les 30 derniers jours.</p>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
