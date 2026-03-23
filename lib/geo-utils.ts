/**
 * Utilitaires géographiques pour la file d'attente virtuelle.
 * Calcul de distance Haversine et estimation de temps de trajet.
 */

const EARTH_RADIUS_METERS = 6_371_000

/**
 * Convertit des degrés en radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calcule la distance entre deux points GPS en mètres (formule Haversine).
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Estime le temps de trajet en minutes.
 * - walking : ~5 km/h
 * - driving : ~30 km/h (moyenne ville avec trafic)
 */
export function estimateTravelTime(
  distanceMeters: number,
  mode: 'walking' | 'driving' = 'driving'
): number {
  const speedKmH = mode === 'walking' ? 5 : 30
  const speedMPerMin = (speedKmH * 1000) / 60
  return Math.ceil(distanceMeters / speedMPerMin)
}

/**
 * Valide des coordonnées GPS.
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Formate une distance en texte lisible.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}
