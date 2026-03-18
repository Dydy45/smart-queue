'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, Mail, Phone, FileText, Loader2 } from 'lucide-react'
import { getAvailableSlots, createAppointment } from '@/app/actions/appointments'
import { getBusinessHoursByPageName } from '@/app/actions/business-hours'

type ServiceOption = {
  id: string
  name: string
  avgTime: number
}

type DayHours = {
  dayOfWeek: number
  dayName: string
  openTime: string
  closeTime: string
  isOpen: boolean
  isConfigured: boolean
}

interface AppointmentCalendarProps {
  services: ServiceOption[]
  pageName: string
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function AppointmentCalendar({ services, pageName }: AppointmentCalendarProps) {
  const [selectedService, setSelectedService] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotDuration, setSlotDuration] = useState<number>(30)
  const [businessHours, setBusinessHours] = useState<DayHours[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cancelToken, setCancelToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Formulaire client
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [notes, setNotes] = useState('')

  // Étape actuelle du wizard
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Charger les horaires d'ouverture
  useEffect(() => {
    const loadHours = async () => {
      const hours = await getBusinessHoursByPageName(pageName)
      if (hours) setBusinessHours(hours)
    }
    loadHours()
  }, [pageName])

  // Charger les créneaux quand une date est sélectionnée
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedService) return
    setIsLoadingSlots(true)
    setAvailableSlots([])
    setSelectedSlot(null)
    try {
      const result = await getAvailableSlots(pageName, selectedService, selectedDate)
      if (result) {
        setAvailableSlots(result.slots)
        setSlotDuration(result.duration)
      }
    } catch {
      setError('Erreur lors du chargement des créneaux')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [selectedDate, selectedService, pageName])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  // Générer la grille du calendrier
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Ajuster pour que la semaine commence le lundi
    let startOffset = firstDay.getDay() - 1
    if (startOffset < 0) startOffset = 6

    const days: (Date | null)[] = []

    // Jours vides avant le 1er
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }

    // Jours du mois
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }

    return days
  }

  const isDaySelectable = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Pas dans le passé
    if (date < today) return false

    // Pas plus de 90 jours
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 90)
    if (date > maxDate) return false

    // Vérifier si le jour est ouvert
    const dayOfWeek = date.getDay()
    const dayHours = businessHours.find(h => h.dayOfWeek === dayOfWeek)
    if (dayHours && !dayHours.isOpen) return false

    return true
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleSubmit = async () => {
    if (!selectedDate || !selectedSlot || !selectedService || !clientName.trim()) return

    setIsSubmitting(true)
    setError(null)

    const appointmentDate = new Date(`${selectedDate}T${selectedSlot}:00`)

    const result = await createAppointment(pageName, {
      serviceId: selectedService,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      appointmentDate: appointmentDate.toISOString(),
      duration: slotDuration,
      notes: notes.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      setSubmitted(true)
      setCancelToken(result.cancelToken || null)
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }

  // Confirmation finale
  if (submitted) {
    const cancelUrl = cancelToken
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/appointment/cancel/${cancelToken}`
      : null

    return (
      <div className="card bg-base-200 max-w-lg mx-auto">
        <div className="card-body text-center">
          <span className="text-5xl mb-2">✅</span>
          <h2 className="text-xl font-bold">Rendez-vous réservé !</h2>
          <div className="text-left mt-4 space-y-2 text-sm">
            <p><strong>Service :</strong> {services.find(s => s.id === selectedService)?.name}</p>
            <p><strong>Date :</strong> {selectedDate && formatDate(selectedDate)}</p>
            <p><strong>Heure :</strong> {selectedSlot}</p>
            <p><strong>Durée :</strong> {slotDuration} min</p>
            <p><strong>Nom :</strong> {clientName}</p>
          </div>
          {cancelUrl && (
            <div className="mt-4 p-3 bg-base-300 rounded-lg text-sm">
              <p className="text-base-content/60 mb-1">Pour annuler votre rendez-vous :</p>
              <a
                href={cancelUrl}
                className="link link-primary break-all text-xs"
              >
                {cancelUrl}
              </a>
            </div>
          )}
          <p className="text-sm text-base-content/60 mt-3">
            Un récapitulatif vous a été envoyé si vous avez fourni un email.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Steps indicator */}
      <ul className="steps steps-horizontal w-full mb-8">
        <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Service</li>
        <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Date & Heure</li>
        <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Vos infos</li>
      </ul>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn btn-ghost btn-xs">✕</button>
        </div>
      )}

      {/* Step 1 : Sélection du service */}
      {step === 1 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">Choisissez un service</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {services.map(service => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service.id)
                    setSlotDuration(service.avgTime)
                    setStep(2)
                  }}
                  className={`card bg-base-100 hover:bg-primary/10 border-2 transition-all cursor-pointer p-4 text-left ${
                    selectedService === service.id ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <span className="font-semibold">{service.name}</span>
                  <span className="text-sm text-base-content/60 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    ~{service.avgTime} min
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2 : Sélection de la date et du créneau */}
      {step === 2 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep(1)} className="btn btn-ghost btn-sm">
                ← Retour
              </button>
              <h2 className="card-title text-base">Choisissez une date et un créneau</h2>
              <div />
            </div>

            {/* Calendrier */}
            <div className="bg-base-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const prev = new Date(currentMonth)
                    prev.setMonth(prev.getMonth() - 1)
                    setCurrentMonth(prev)
                  }}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label="Mois précédent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold">
                  {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => {
                    const next = new Date(currentMonth)
                    next.setMonth(next.getMonth() + 1)
                    setCurrentMonth(next)
                  }}
                  className="btn btn-ghost btn-sm btn-circle"
                  aria-label="Mois suivant"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_FR.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-base-content/50 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="p-2" />
                  }

                  const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
                  const isSelectable = isDaySelectable(date)
                  const isSelected = selectedDate === dateStr
                  const isToday = new Date().toDateString() === date.toDateString()

                  return (
                    <button
                      key={dateStr}
                      onClick={() => isSelectable && setSelectedDate(dateStr)}
                      disabled={!isSelectable}
                      className={`p-2 text-sm rounded-lg transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-content font-bold'
                          : isToday
                          ? 'bg-accent/20 font-semibold'
                          : isSelectable
                          ? 'hover:bg-base-200 cursor-pointer'
                          : 'text-base-content/20 cursor-not-allowed'
                      }`}
                      aria-label={`${date.getDate()} ${MONTHS_FR[date.getMonth()]}`}
                    >
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Créneaux horaires */}
            {selectedDate && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">
                  Créneaux disponibles — {formatDate(selectedDate)}
                </h3>
                {isLoadingSlots ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-center py-6 text-base-content/50">
                    Aucun créneau disponible ce jour
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`btn btn-sm ${
                          selectedSlot === slot ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}

                {selectedSlot && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setStep(3)}
                      className="btn btn-primary"
                    >
                      Continuer →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 : Formulaire informations client */}
      {step === 3 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setStep(2)} className="btn btn-ghost btn-sm">
                ← Retour
              </button>
              <h2 className="card-title text-base">Vos informations</h2>
              <div />
            </div>

            {/* Récap RDV */}
            <div className="bg-base-100 rounded-lg p-3 mb-4 text-sm">
              <p><strong>Service :</strong> {services.find(s => s.id === selectedService)?.name}</p>
              <p><strong>Date :</strong> {selectedDate && formatDate(selectedDate)} à {selectedSlot}</p>
              <p><strong>Durée :</strong> ~{slotDuration} min</p>
            </div>

            <div className="space-y-4">
              {/* Nom */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text flex items-center gap-1">
                    <User className="w-4 h-4" /> Nom complet *
                  </span>
                </div>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Votre nom"
                  className="input input-bordered"
                  maxLength={100}
                  required
                />
              </label>

              {/* Email */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text flex items-center gap-1">
                    <Mail className="w-4 h-4" /> Email (pour confirmation)
                  </span>
                </div>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="input input-bordered"
                />
              </label>

              {/* Téléphone */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text flex items-center gap-1">
                    <Phone className="w-4 h-4" /> Téléphone (pour rappels)
                  </span>
                </div>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="input input-bordered"
                  maxLength={20}
                />
              </label>

              {/* Notes */}
              <label className="form-control">
                <div className="label">
                  <span className="label-text flex items-center gap-1">
                    <FileText className="w-4 h-4" /> Notes (optionnel)
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  className="textarea textarea-bordered"
                  maxLength={500}
                  rows={3}
                />
                <div className="label">
                  <span className="label-text-alt">{notes.length}/500</span>
                </div>
              </label>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !clientName.trim()}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Réservation en cours...
                  </>
                ) : (
                  '📅 Confirmer le rendez-vous'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
