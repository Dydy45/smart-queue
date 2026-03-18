'use client'

import { useEffect, useState } from 'react'
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Users, Loader2 } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper'
import {
  getAppointmentsByCompany,
  getAppointmentStats,
  confirmAppointment,
  updateAppointmentStatus
} from '@/app/actions/appointments'

type AppointmentItem = {
  id: string
  clientName: string
  clientEmail: string | null
  clientPhone: string | null
  appointmentDate: string
  duration: number
  status: string
  serviceName: string
  postName: string | null
  notes: string | null
  cancelReason: string | null
  createdAt: string
}

type Stats = {
  total: number
  todayCount: number
  weekCount: number
  noShowRate: number
  byStatus: Record<string, number>
}

const STATUS_LABELS: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  PENDING: { label: 'En attente', badge: 'badge-warning', icon: <Clock className="w-3 h-3" /> },
  CONFIRMED: { label: 'Confirmé', badge: 'badge-info', icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { label: 'Annulé', badge: 'badge-error', icon: <XCircle className="w-3 h-3" /> },
  COMPLETED: { label: 'Terminé', badge: 'badge-success', icon: <CheckCircle className="w-3 h-3" /> },
  NO_SHOW: { label: 'Absent', badge: 'badge-ghost', icon: <AlertTriangle className="w-3 h-3" /> },
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week')
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const now = new Date()
      let startDate: string | undefined
      let endDate: string | undefined

      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      } else if (dateRange === 'week') {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        startDate = weekStart.toISOString()
        endDate = weekEnd.toISOString()
      } else if (dateRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
      }

      const statusFilter = filter !== 'all' ? filter : undefined

      const [aptsData, statsData] = await Promise.all([
        getAppointmentsByCompany(startDate, endDate, statusFilter),
        getAppointmentStats(),
      ])

      setAppointments(aptsData)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, dateRange])

  const handleConfirm = async (id: string) => {
    setActionLoading(id)
    const result = await confirmAppointment(id)
    if (!result.success) setError(result.error || 'Erreur')
    await loadData()
    setActionLoading(null)
  }

  const handleStatusChange = async (id: string, status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED') => {
    setActionLoading(id)
    const result = await updateAppointmentStatus(id, status)
    if (!result.success) setError(result.error || 'Erreur')
    await loadData()
    setActionLoading(null)
  }

  if (isLoading && !stats) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center min-h-[50vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Rendez-vous
        </h1>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-ghost btn-xs">✕</button>
        </div>
      )}

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card bg-base-200 p-4">
            <p className="text-sm text-base-content/60">Aujourd&apos;hui</p>
            <span className="text-3xl font-bold">{stats.todayCount}</span>
          </div>
          <div className="card bg-base-200 p-4">
            <p className="text-sm text-base-content/60">Cette semaine</p>
            <span className="text-3xl font-bold">{stats.weekCount}</span>
          </div>
          <div className="card bg-base-200 p-4">
            <p className="text-sm text-base-content/60">Total</p>
            <span className="text-3xl font-bold">{stats.total}</span>
          </div>
          <div className="card bg-base-200 p-4">
            <p className="text-sm text-base-content/60">Taux no-show</p>
            <span className={`text-3xl font-bold ${stats.noShowRate > 15 ? 'text-error' : 'text-success'}`}>
              {stats.noShowRate}%
            </span>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="join">
          {(['today', 'week', 'month', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`join-item btn btn-sm ${dateRange === range ? 'btn-primary' : 'btn-ghost'}`}
            >
              {range === 'today' ? "Aujourd'hui" : range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Tout'}
            </button>
          ))}
        </div>
        <div className="join">
          {['all', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`join-item btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
            >
              {status === 'all' ? 'Tous' : STATUS_LABELS[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des rendez-vous */}
      {appointments.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Aucun rendez-vous trouvé</p>
          <p className="text-sm mt-1">Modifiez les filtres ou la période pour voir plus de résultats.</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-base-300">
          {appointments.map(apt => {
            const aptDate = new Date(apt.appointmentDate)
            const statusInfo = STATUS_LABELS[apt.status] || STATUS_LABELS.PENDING
            const isPast = aptDate < new Date()

            return (
              <div key={apt.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">{apt.clientName}</span>
                      <span className={`badge ${statusInfo.badge} gap-1`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-sm text-base-content/60 mt-1 space-y-0.5">
                      <p>
                        📅 {aptDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        {' '}à {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {' '}({apt.duration} min)
                      </p>
                      <p>🏷️ {apt.serviceName} {apt.postName ? `→ ${apt.postName}` : ''}</p>
                      {apt.clientEmail && <p>✉️ {apt.clientEmail}</p>}
                      {apt.clientPhone && <p>📱 {apt.clientPhone}</p>}
                      {apt.notes && <p className="italic">💬 {apt.notes}</p>}
                      {apt.cancelReason && <p className="text-error">❌ {apt.cancelReason}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {actionLoading === apt.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {apt.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleConfirm(apt.id)}
                              className="btn btn-success btn-sm"
                            >
                              ✓ Confirmer
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                              className="btn btn-error btn-sm btn-outline"
                            >
                              ✕ Annuler
                            </button>
                          </>
                        )}
                        {apt.status === 'CONFIRMED' && isPast && (
                          <>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                              className="btn btn-success btn-sm"
                            >
                              ✓ Terminé
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'NO_SHOW')}
                              className="btn btn-warning btn-sm btn-outline"
                            >
                              ⚠ Absent
                            </button>
                          </>
                        )}
                        {apt.status === 'CONFIRMED' && !isPast && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                            className="btn btn-error btn-sm btn-outline"
                          >
                            ✕ Annuler
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Wrapper>
  )
}
