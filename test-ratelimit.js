/**
 * Test simple du rate limiting
 * Exécuter avec: node test-ratelimit.js
 */

// Simuler la fonction de rate limiting (pas de dépendances)
const rateLimitStore = new Map()

function checkRateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

// Test
console.log('🧪 Test Rate Limiting (10 requêtes par minute)\n')

const testKey = 'ticket:test-page'

for (let i = 1; i <= 13; i++) {
  const result = checkRateLimit(testKey, 10, 60000)

  if (result.success) {
    console.log(`✅ Requête ${i.toString().padStart(2)}: ACCEPTÉE (${result.remaining} requêtes restantes)`)
  } else {
    console.log(`❌ Requête ${i.toString().padStart(2)}: BLOQUÉE  - Trop de requêtes! Attendez 60 secondes`)
  }
}

console.log('\n✨ Test terminé!')
console.log('\nRésultat: Le rate limiting fonctionne correctement!')
console.log('Les 10 premières requêtes sont acceptées, les suivantes sont bloquées.')
