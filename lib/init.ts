/**
 * Initialisation du rate limiting
 * Lance le nettoyage en arrière-plan
 */
import { startRateLimitCleanup } from './ratelimit'

// Lancer le nettoyage une seule fois au démarrage
if (typeof window === 'undefined') {
  // Code serveur uniquement
  startRateLimitCleanup()
}
