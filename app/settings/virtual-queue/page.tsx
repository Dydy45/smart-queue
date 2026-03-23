'use client'

import { useEffect, useState } from 'react'
import { MapPin, ToggleLeft, ToggleRight, Save, Loader2, Navigation, Radio } from 'lucide-react'
import Wrapper from '@/app/components/Wrapper'
import {
  getVirtualQueueConfig,
  updateCompanyLocation,
  toggleVirtualQueue,
  updateProximityRadius,
} from '@/app/actions/virtual-queue'

export default function VirtualQueueSettingsPage() {
  const [enabled, setEnabled] = useState(false)
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')
  const [radius, setRadius] = useState(500)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const config = await getVirtualQueueConfig()
        if (config) {
          setEnabled(config.enabled)
          setLatitude(config.latitude?.toString() ?? '')
          setLongitude(config.longitude?.toString() ?? '')
          setRadius(config.proximityRadius)
        }
      } catch (err) {
        console.error(err)
        setError('Erreur lors du chargement de la configuration')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur')
      return
    }
    setIsLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6))
        setLongitude(position.coords.longitude.toFixed(6))
        setIsLocating(false)
        setSuccess('Position détectée avec succès')
        setTimeout(() => setSuccess(null), 3000)
      },
      (err) => {
        setIsLocating(false)
        setError(`Impossible d'obtenir votre position : ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleSaveLocation = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (isNaN(lat) || isNaN(lng)) {
        setError('Veuillez entrer des coordonnées valides')
        return
      }
      const result = await updateCompanyLocation(lat, lng)
      if (result.success) {
        setSuccess('Localisation enregistrée')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      setError('Erreur serveur')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async () => {
    setError(null)
    setSuccess(null)
    const newValue = !enabled
    const result = await toggleVirtualQueue(newValue)
    if (result.success) {
      setEnabled(newValue)
      setSuccess(newValue ? 'File virtuelle activée' : 'File virtuelle désactivée')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Erreur lors du changement')
    }
  }

  const handleSaveRadius = async () => {
    setError(null)
    setSuccess(null)
    const result = await updateProximityRadius(radius)
    if (result.success) {
      setSuccess('Rayon de proximité mis à jour')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Erreur lors de la sauvegarde')
    }
  }

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <MapPin className="w-6 h-6 text-primary" />
          File d&apos;attente virtuelle
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Permettez à vos clients de prendre un ticket depuis chez eux et d&apos;être guidés par GPS.
        </p>

        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success mb-4" role="status">
            <span>{success}</span>
          </div>
        )}

        {/* Toggle activation */}
        <div className="border border-base-300 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">Activer la file virtuelle</h2>
              <p className="text-sm text-gray-500">
                Les clients pourront prendre un ticket à distance et suivre leur position en temps réel.
              </p>
            </div>
            <button
              className="btn btn-ghost btn-lg"
              onClick={handleToggle}
              aria-label={enabled ? 'Désactiver la file virtuelle' : 'Activer la file virtuelle'}
            >
              {enabled ? (
                <ToggleRight className="w-10 h-10 text-success" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-400" />
              )}
            </button>
          </div>
          {enabled && (
            <div className="badge badge-success mt-2">Activée</div>
          )}
        </div>

        {/* Localisation de l'entreprise */}
        <div className="border border-base-300 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Navigation className="w-5 h-5" />
            Localisation de votre entreprise
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Nécessaire pour calculer la distance et le temps de trajet de vos clients.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div className="form-control flex-1">
              <label className="label" htmlFor="latitude">
                <span className="label-text">Latitude</span>
              </label>
              <input
                id="latitude"
                type="number"
                step="any"
                placeholder="48.8566"
                className="input input-bordered w-full"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                aria-label="Latitude"
              />
            </div>
            <div className="form-control flex-1">
              <label className="label" htmlFor="longitude">
                <span className="label-text">Longitude</span>
              </label>
              <input
                id="longitude"
                type="number"
                step="any"
                placeholder="2.3522"
                className="input input-bordered w-full"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                aria-label="Longitude"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm gap-2"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              aria-label="Utiliser ma position actuelle"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              Utiliser ma position
            </button>
            <button
              className="btn btn-primary btn-sm gap-2"
              onClick={handleSaveLocation}
              disabled={isSaving || !latitude || !longitude}
              aria-label="Enregistrer la localisation"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer
            </button>
          </div>

          {latitude && longitude && (
            <div className="mt-3 text-sm text-gray-500">
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary"
              >
                Voir sur OpenStreetMap
              </a>
            </div>
          )}
        </div>

        {/* Rayon de proximité */}
        <div className="border border-base-300 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5" />
            Rayon de proximité
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Distance en mètres à partir de laquelle le client est considéré comme &quot;arrivé&quot;.
            Une notification sera envoyée automatiquement.
          </p>

          <div className="flex items-center gap-4 mb-2">
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="range range-primary flex-1"
              aria-label="Rayon de proximité"
            />
            <span className="badge badge-primary badge-lg min-w-[80px] justify-center">
              {radius} m
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-4">
            <span>100 m</span>
            <span>500 m</span>
            <span>1 km</span>
            <span>1.5 km</span>
            <span>2 km</span>
          </div>

          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={handleSaveRadius}
            aria-label="Sauvegarder le rayon"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>

        {/* Info */}
        <div className="border border-base-300 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Comment ça fonctionne ?</h2>
          <div className="text-sm space-y-2">
            <p>
              <strong>1.</strong> Le client prend un ticket virtuel via votre page publique et partage sa position GPS.
            </p>
            <p>
              <strong>2.</strong> Il reçoit un lien de suivi en temps réel montrant sa position dans la file,
              le temps d&apos;attente estimé et la distance jusqu&apos;à votre établissement.
            </p>
            <p>
              <strong>3.</strong> Quand son temps d&apos;attente ≈ son temps de trajet, il reçoit une notification
              WhatsApp <em>&quot;Partez maintenant !&quot;</em>
            </p>
            <p>
              <strong>4.</strong> Quand il entre dans le rayon de proximité ({radius} m),
              il reçoit une notification <em>&quot;Vous êtes arrivé !&quot;</em>
            </p>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
