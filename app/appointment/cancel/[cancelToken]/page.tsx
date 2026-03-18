'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAppointmentByToken, cancelAppointmentByToken } from '@/app/actions/appointments'

type AppointmentInfo = {
  id: string
  clientName: string
  appointmentDate: string
  duration: number
  status: string
  serviceName: string
  companyName: string
  postName: string | null
  notes: string | null
  cancelReason: string | null
}

export default function CancelAppointmentPage() {
  const params = useParams()
  const cancelToken = params.cancelToken as string

  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const data = await getAppointmentByToken(cancelToken)
      setAppointment(data)
      setIsLoading(false)
    }
    load()
  }, [cancelToken])

  const handleCancel = async () => {
    setIsCancelling(true)
    setError(null)
    const result = await cancelAppointmentByToken(cancelToken, reason.trim() || undefined)
    setIsCancelling(false)
    if (result.success) {
      setCancelled(true)
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="card bg-base-200 max-w-md">
          <div className="card-body text-center">
            <span className="text-4xl mb-2">❌</span>
            <h1 className="text-xl font-bold">Rendez-vous introuvable</h1>
            <p className="text-base-content/60">Ce lien n&apos;est pas valide ou le rendez-vous a été supprimé.</p>
          </div>
        </div>
      </div>
    )
  }

  if (cancelled || appointment.status === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center px-4">
        <div className="card bg-base-200 max-w-md">
          <div className="card-body text-center">
            <span className="text-4xl mb-2">🚫</span>
            <h1 className="text-xl font-bold">Rendez-vous annulé</h1>
            <p className="text-base-content/60">
              Votre rendez-vous chez <strong>{appointment.companyName}</strong> a été annulé.
            </p>
            {appointment.cancelReason && (
              <p className="text-sm text-base-content/50 mt-2">
                Raison : {appointment.cancelReason}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (appointment.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center px-4">
        <div className="card bg-base-200 max-w-md">
          <div className="card-body text-center">
            <span className="text-4xl mb-2">✅</span>
            <h1 className="text-xl font-bold">Rendez-vous terminé</h1>
            <p className="text-base-content/60">Ce rendez-vous est déjà terminé.</p>
          </div>
        </div>
      </div>
    )
  }

  const aptDate = new Date(appointment.appointmentDate)

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center px-4">
      <div className="card bg-base-200 max-w-md w-full">
        <div className="card-body">
          <h1 className="text-xl font-bold text-center mb-4">Annuler votre rendez-vous ?</h1>

          <div className="bg-base-100 rounded-lg p-4 space-y-2 text-sm">
            <p><strong>Entreprise :</strong> {appointment.companyName}</p>
            <p><strong>Service :</strong> {appointment.serviceName}</p>
            <p>
              <strong>Date :</strong>{' '}
              {aptDate.toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
            <p><strong>Heure :</strong> {aptDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Durée :</strong> {appointment.duration} min</p>
            <p><strong>Nom :</strong> {appointment.clientName}</p>
            {appointment.postName && <p><strong>Poste :</strong> {appointment.postName}</p>}
          </div>

          {error && (
            <div className="alert alert-error mt-3">
              <span>{error}</span>
            </div>
          )}

          <label className="form-control mt-4">
            <div className="label">
              <span className="label-text">Raison de l&apos;annulation (optionnel)</span>
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Motif de l'annulation..."
              className="textarea textarea-bordered"
              maxLength={200}
              rows={2}
            />
          </label>

          <div className="flex gap-3 mt-4">
            <a href="/" className="btn btn-ghost flex-1">
              Retour
            </a>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="btn btn-error flex-1"
            >
              {isCancelling ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                '🚫 Annuler le RDV'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
