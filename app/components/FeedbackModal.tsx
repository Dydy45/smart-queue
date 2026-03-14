'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { submitFeedback } from '@/app/actions/feedback'

interface FeedbackModalProps {
  ticketId: string
  ticketNumber: string
  isOpen: boolean
  onClose: () => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Très insatisfait',
  2: 'Insatisfait',
  3: 'Correct',
  4: 'Satisfait',
  5: 'Très satisfait',
}

export default function FeedbackModal({ ticketId, ticketNumber, isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeRating = hoveredRating || rating

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const result = await submitFeedback({
      ticketId,
      rating,
      comment: comment.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoveredRating(0)
    setComment('')
    setError(null)
    setSubmitted(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-md">
        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-bold">Merci pour votre avis !</h3>
            <p className="text-base-content/70">
              Votre retour nous aide à améliorer notre service.
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-base-300'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <button onClick={handleClose} className="btn btn-primary btn-sm mt-2">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-center">
              Comment s&apos;est passé votre service ?
            </h3>
            <p className="text-center text-sm text-base-content/60 mt-1">
              Ticket <span className="font-mono font-semibold">#{ticketNumber}</span>
            </p>

            {/* Étoiles interactives */}
            <div className="flex flex-col items-center my-6 gap-2">
              <div className="flex gap-3" role="radiogroup" aria-label="Note de satisfaction">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:scale-110 focus:outline-none cursor-pointer"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} étoile${star > 1 ? 's' : ''} - ${RATING_LABELS[star]}`}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= activeRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-base-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span
                className={`text-sm font-medium h-5 transition-opacity ${
                  activeRating > 0 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {activeRating > 0 ? RATING_LABELS[activeRating] : ''}
              </span>
            </div>

            {/* Commentaire optionnel */}
            <div className="form-control">
              <label className="label" htmlFor="feedback-comment">
                <span className="label-text">Commentaire (optionnel)</span>
                <span className="label-text-alt">{comment.length}/500</span>
              </label>
              <textarea
                id="feedback-comment"
                placeholder="Partagez votre expérience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="textarea textarea-bordered w-full resize-none"
              />
            </div>

            {/* Erreur */}
            {error && (
              <div className="alert alert-error mt-3 text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="modal-action">
              <button
                onClick={handleClose}
                className="btn btn-ghost btn-sm"
                disabled={isSubmitting}
              >
                Plus tard
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="btn btn-primary btn-sm"
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  'Envoyer mon avis'
                )}
              </button>
            </div>
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>Fermer</button>
      </form>
    </dialog>
  )
}
