import crypto from 'crypto'

/**
 * Génère un numéro de ticket sécurisé en utilisant crypto
 * Format: T[timestamp en base 36][4 bytes aléatoires en base 36]
 * Exemple: T20250301A4K9L
 */
export function generateTicketNumber(): string {
  const date = Date.now().toString(36)
  const random = crypto.getRandomValues(new Uint8Array(4))
    .reduce((acc, byte) => acc + byte.toString(36), '')
  return `T${date}${random}`.toUpperCase().substring(0, 10)
}
