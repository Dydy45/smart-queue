/**
 * Rate Limiting Configuration
 * Limite le nombre de requêtes par utilisateur/IP pour éviter les abus
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store en mémoire pour le développement
// En production, utiliser Redis/Upstash
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Vérifie et met à jour le rate limit pour une clé donnée
 * @param key - Clé unique (email, IP, pageName, etc.)
 * @param limit - Nombre maximum de requêtes
 * @param windowMs - Fenêtre de temps en millisecondes
 * @returns {success: boolean, remaining: number}
 */
export async function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute par défaut
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Si pas d'entrée ou fenêtre expirée
  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return { success: true, remaining: limit - 1 }
  }

  // Si limite atteinte
  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  // Incrémenter le compteur
  entry.count++
  return { success: true, remaining: limit - entry.count }
}

/**
 * Rate limit configurations prédéfinies
 */
export const rateLimitConfig = {
  // Création de tickets: 10 par minute par page
  createTicket: {
    limit: 10,
    windowMs: 60 * 1000 // 1 minute
  },

  // Création de services: 5 par minute par email
  createService: {
    limit: 5,
    windowMs: 60 * 1000 // 1 minute
  },

  // Création de postes: 5 par minute par email
  createPost: {
    limit: 5,
    windowMs: 60 * 1000 // 1 minute
  },

  // Mise à jour de tickets: 20 par minute par email
  updateTicket: {
    limit: 20,
    windowMs: 60 * 1000 // 1 minute
  },

  // Appel de tickets: 15 par minute par email
  callTicket: {
    limit: 15,
    windowMs: 60 * 1000 // 1 minute
  }
}

/**
 * Nettoie les entrées expirées toutes les 10 minutes
 * pour éviter une fuite mémoire
 */
export function startRateLimitCleanup() {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 10 * 60 * 1000) // Nettoyage toutes les 10 minutes
}

/**
 * Classe d'erreur pour les limites de taux dépassées
 */
export class RateLimitError extends Error {
  constructor(
    message: string = 'Trop de requêtes. Veuillez réessayer plus tard.',
    public retryAfter: number = 60
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}
