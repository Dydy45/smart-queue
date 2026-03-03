/**
 * Script de test pour vérifier le Rate Limiting
 * Usage: npx ts-node test-ratelimit.ts
 * Ou: node -r @swc/register test-ratelimit.ts
 */

import { checkRateLimit, rateLimitConfig, RateLimitError } from './lib/ratelimit'

async function testRateLimiting() {
  console.log('🧪 Test de Rate Limiting\n')

  const testKey = 'ticket:test-page'
  const limit = rateLimitConfig.createTicket.limit
  const window = rateLimitConfig.createTicket.windowMs

  console.log(`Limite: ${limit} requêtes par ${window / 1000} secondes`)
  console.log(`Clé de test: ${testKey}\n`)

  // Essayer de créer plus de tickets que la limite
  for (let i = 1; i <= limit + 3; i++) {
    try {
      const result = await checkRateLimit(testKey, limit, window)

      if (result.success) {
        console.log(`✅ Requête ${i}: Acceptée (${result.remaining} restantes)`)
      } else {
        console.log(`❌ Requête ${i}: BLOQUÉE - Trop de requêtes!`)
      }
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(`⛔ Requête ${i}: ${error.message}`)
      }
    }

    // Petit délai pour plus de clarté
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n✨ Test terminé!')
}

// Exécuter le test
testRateLimiting().catch(console.error)
