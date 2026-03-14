'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper'
import { getFeedbackStats, getRecentFeedbacks } from '@/app/actions/feedback'

type FeedbackStats = {
  total: number
  average: number
  distribution: Record<number, number>
  trend: number
  currentWeekCount: number
  previousWeekCount: number
}

type FeedbackItem = {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  ticketNum: string
  clientName: string
  postName: string | null
  serviceName: string
}

export default function FeedbacksPage() {
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, feedbacksData] = await Promise.all([
          getFeedbackStats(),
          getRecentFeedbacks(20),
        ])
        setStats(statsData)
        setFeedbacks(feedbacksData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const renderStars = (rating: number, size: string = 'w-4 h-4') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-base-300'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  )

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </Wrapper>
    )
  }

  if (error) {
    return (
      <Wrapper>
        <div className="alert alert-error max-w-md mx-auto mt-10">
          <span>{error}</span>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <h1 className="text-2xl font-bold mb-6">Feedbacks Clients</h1>

      {/* Statistiques globales */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Moyenne */}
          <div className="card bg-base-200 p-5">
            <p className="text-sm text-base-content/60">Satisfaction moyenne</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold">{stats.average || '—'}</span>
              <span className="text-xl">/5</span>
            </div>
            {stats.average > 0 && (
              <div className="mt-2">{renderStars(Math.round(stats.average), 'w-5 h-5')}</div>
            )}
          </div>

          {/* Total */}
          <div className="card bg-base-200 p-5">
            <p className="text-sm text-base-content/60">Total des avis</p>
            <span className="text-3xl font-bold mt-1">{stats.total}</span>
            <p className="text-xs text-base-content/50 mt-1">
              {stats.currentWeekCount} cette semaine
            </p>
          </div>

          {/* Tendance */}
          <div className="card bg-base-200 p-5">
            <p className="text-sm text-base-content/60">Tendance (7j)</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold">
                {stats.trend > 0 ? '📈' : stats.trend < 0 ? '📉' : '➡️'}
              </span>
              <span className={`text-lg font-semibold ${
                stats.trend > 0 ? 'text-success' : stats.trend < 0 ? 'text-error' : ''
              }`}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}%
              </span>
            </div>
            <p className="text-xs text-base-content/50 mt-1">
              vs semaine précédente
            </p>
          </div>

          {/* Taux de satisfaction */}
          <div className="card bg-base-200 p-5">
            <p className="text-sm text-base-content/60">Taux satisfaction</p>
            {stats.total > 0 ? (
              <>
                <span className="text-3xl font-bold mt-1">
                  {Math.round(((stats.distribution[4] + stats.distribution[5]) / stats.total) * 100)}%
                </span>
                <p className="text-xs text-base-content/50 mt-1">
                  4-5 étoiles
                </p>
              </>
            ) : (
              <span className="text-3xl font-bold mt-1">—</span>
            )}
          </div>
        </div>
      )}

      {/* Distribution par étoiles */}
      {stats && stats.total > 0 && (
        <div className="card bg-base-200 p-5 mb-8">
          <h2 className="font-bold mb-4">Distribution des notes</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0
              const percent = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-medium text-right">{star} ⭐</span>
                  <progress
                    className={`progress flex-1 ${
                      star >= 4 ? 'progress-success' : star === 3 ? 'progress-warning' : 'progress-error'
                    }`}
                    value={percent}
                    max={100}
                    aria-label={`${star} étoiles: ${count} avis (${Math.round(percent)}%)`}
                  />
                  <span className="w-20 text-sm text-base-content/60">
                    {count} ({Math.round(percent)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Liste des feedbacks récents */}
      <div className="card bg-base-200 p-5">
        <h2 className="font-bold mb-4">Avis récents</h2>
        {feedbacks.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <p className="text-4xl mb-2">📭</p>
            <p>Aucun avis pour le moment</p>
            <p className="text-sm mt-1">Les avis apparaîtront ici après que vos clients aient donné leur retour.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-base-300">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {renderStars(feedback.rating)}
                    <span className="font-mono text-sm font-semibold">#{feedback.ticketNum}</span>
                    <span className="text-sm">{feedback.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-base-content/50">
                    <span className="badge badge-ghost badge-sm">{feedback.serviceName}</span>
                    {feedback.postName && (
                      <span className="badge badge-ghost badge-sm">{feedback.postName}</span>
                    )}
                    <time dateTime={feedback.createdAt}>
                      {new Date(feedback.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>
                {feedback.comment && (
                  <p className="text-sm text-base-content/70 mt-2 pl-1 border-l-2 border-primary/30 ml-1">
                    {feedback.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  )
}
