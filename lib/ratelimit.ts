/**
 * Rate Limiting Configuration
 * Utilise Upstash Redis en production, fallback en mémoire pour le dev local
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ===== Upstash Redis (production) =====

const isUpstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

let redis: Redis | null = null
if (isUpstashConfigured) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

// Cache des instances Ratelimit Upstash (1 par combinaison limit/window)
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`
  let limiter = upstashLimiters.get(key)
  if (!limiter) {
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000))
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: 'sq_rl',
    })
    upstashLimiters.set(key, limiter)
  }
  return limiter
}

// ===== Fallback en mémoire (dev local) =====

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function checkInMemory(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

// ===== API publique (même signature qu'avant) =====

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
  windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  if (isUpstashConfigured && redis) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs)
      const { success, remaining } = await limiter.limit(key)
      return { success, remaining }
    } catch {
      // Fallback silencieux si Upstash échoue
      return checkInMemory(key, limit, windowMs)
    }
  }

  return checkInMemory(key, limit, windowMs)
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
  },

  // Gestion du staff: 10 par minute par email
  addStaff: {
    limit: 10,
    windowMs: 60 * 1000 // 1 minute
  },

  updateStaff: {
    limit: 20,
    windowMs: 60 * 1000 // 1 minute
  },

  removeStaff: {
    limit: 10,
    windowMs: 60 * 1000 // 1 minute
  },

  assignPost: {
    limit: 20,
    windowMs: 60 * 1000 // 1 minute
  },

  unassignPost: {
    limit: 20,
    windowMs: 60 * 1000 // 1 minute
  }
}

/**
 * Nettoyage des entrées expirées (fallback mémoire uniquement)
 * No-op si Upstash est configuré (TTL géré par Redis)
 */
export function startRateLimitCleanup() {
  if (isUpstashConfigured) return
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
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
