'use client'

import { useEffect, useState } from 'react'
import { Clock, Save, Plus, Trash2, Loader2, CalendarOff } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper'
import {
  getBusinessHours,
  setAllBusinessHours,
  getClosedDates,
  addClosedDate,
  removeClosedDate
} from '@/app/actions/business-hours'

type DayHours = {
  dayOfWeek: number
  dayName: string
  openTime: string
  closeTime: string
  isOpen: boolean
  isConfigured: boolean
}

type ClosedDateItem = {
  id: string
  date: string
  reason: string | null
}

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<DayHours[]>([])
  const [closedDates, setClosedDates] = useState<ClosedDateItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingDate, setIsAddingDate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newClosedDate, setNewClosedDate] = useState('')
  const [newClosedReason, setNewClosedReason] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hoursData, datesData] = await Promise.all([
          getBusinessHours(),
          getClosedDates(),
        ])
        setHours(hoursData)
        setClosedDates(datesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const updateDay = (dayOfWeek: number, field: string, value: string | boolean) => {
    setHours(prev =>
      prev.map(h =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    )
  }

  const handleSaveHours = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const result = await setAllBusinessHours(
      hours.map(h => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        isOpen: h.isOpen,
      }))
    )

    setIsSaving(false)

    if (result.success) {
      setSuccess('Horaires enregistrés avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Erreur lors de la sauvegarde')
    }
  }

  const handleAddClosedDate = async () => {
    if (!newClosedDate) return
    setIsAddingDate(true)
    setError(null)

    const result = await addClosedDate({
      date: newClosedDate,
      reason: newClosedReason.trim() || undefined,
    })

    setIsAddingDate(false)

    if (result.success) {
      const datesData = await getClosedDates()
      setClosedDates(datesData)
      setNewClosedDate('')
      setNewClosedReason('')
      if (result.cancelledCount && result.cancelledCount > 0) {
        setSuccess(`Date ajoutée. ${result.cancelledCount} rendez-vous annulé(s) automatiquement.`)
      } else {
        setSuccess('Date de fermeture ajoutée')
      }
      setTimeout(() => setSuccess(null), 4000)
    } else {
      setError(result.error || 'Erreur')
    }
  }

  const handleRemoveClosedDate = async (id: string) => {
    const result = await removeClosedDate(id)
    if (result.success) {
      setClosedDates(prev => prev.filter(d => d.id !== id))
    } else {
      setError(result.error || 'Erreur')
    }
  }

  if (isLoading) {
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
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6" />
        Horaires d&apos;ouverture
      </h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-ghost btn-xs">✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <span>{success}</span>
        </div>
      )}

      {/* Horaires hebdomadaires */}
      <div className="card bg-base-200 mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">Horaires hebdomadaires</h2>

          <div className="space-y-3">
            {hours.map(day => (
              <div
                key={day.dayOfWeek}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg ${
                  day.isOpen ? 'bg-base-100' : 'bg-base-300/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={e => updateDay(day.dayOfWeek, 'isOpen', e.target.checked)}
                    className="toggle toggle-primary toggle-sm"
                    aria-label={`${day.dayName} ouvert`}
                  />
                  <span className={`font-semibold ${!day.isOpen ? 'text-base-content/40' : ''}`}>
                    {day.dayName}
                  </span>
                </div>

                {day.isOpen ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={e => updateDay(day.dayOfWeek, 'openTime', e.target.value)}
                      className="input input-bordered input-sm w-32"
                      aria-label={`${day.dayName} heure d'ouverture`}
                    />
                    <span className="text-base-content/50">→</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={e => updateDay(day.dayOfWeek, 'closeTime', e.target.value)}
                      className="input input-bordered input-sm w-32"
                      aria-label={`${day.dayName} heure de fermeture`}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-base-content/40 italic">Fermé</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveHours}
              disabled={isSaving}
              className="btn btn-primary gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer les horaires
            </button>
          </div>
        </div>
      </div>

      {/* Fermetures exceptionnelles */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg flex items-center gap-2 mb-4">
            <CalendarOff className="w-5 h-5" />
            Fermetures exceptionnelles
          </h2>

          <p className="text-sm text-base-content/60 mb-4">
            Les rendez-vous existants seront automatiquement annulés pour les dates ajoutées.
          </p>

          {/* Formulaire d'ajout */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="date"
              value={newClosedDate}
              onChange={e => setNewClosedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input input-bordered input-sm"
              aria-label="Date de fermeture"
            />
            <input
              type="text"
              value={newClosedReason}
              onChange={e => setNewClosedReason(e.target.value)}
              placeholder="Raison (optionnel)"
              className="input input-bordered input-sm flex-1"
              maxLength={200}
            />
            <button
              onClick={handleAddClosedDate}
              disabled={!newClosedDate || isAddingDate}
              className="btn btn-sm btn-outline gap-1"
            >
              {isAddingDate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Ajouter
            </button>
          </div>

          {/* Liste des fermetures */}
          {closedDates.length === 0 ? (
            <p className="text-center text-base-content/40 py-4">
              Aucune fermeture exceptionnelle planifiée
            </p>
          ) : (
            <div className="space-y-2">
              {closedDates.map(cd => {
                const dateObj = new Date(cd.date + 'T00:00:00')
                const isPast = dateObj < new Date()
                return (
                  <div
                    key={cd.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isPast ? 'bg-base-300/30 text-base-content/40' : 'bg-base-100'
                    }`}
                  >
                    <div>
                      <span className="font-medium">
                        {dateObj.toLocaleDateString('fr-FR', {
                          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </span>
                      {cd.reason && (
                        <span className="text-sm text-base-content/50 ml-2">— {cd.reason}</span>
                      )}
                    </div>
                    {!isPast && (
                      <button
                        onClick={() => handleRemoveClosedDate(cd.id)}
                        className="btn btn-ghost btn-xs text-error"
                        aria-label="Supprimer cette fermeture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}
