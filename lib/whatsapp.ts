import twilio from 'twilio'
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js'

// ===== Configuration =====

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
const notificationThreshold = parseInt(process.env.WHATSAPP_NOTIFICATION_THRESHOLD || '2', 10)
const whatsappEnabled = process.env.WHATSAPP_ENABLED !== 'false'

// ===== Client Twilio (lazy init) =====

let twilioClient: twilio.Twilio | null = null

function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    if (!accountSid || !authToken) {
      throw new Error(
        '[WhatsApp] Variables TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN manquantes dans .env'
      )
    }
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

// ===== Validation du numéro =====

export function validatePhoneNumber(phone: string): {
  valid: boolean
  formatted: string | null
  error: string | null
} {
  try {
    if (!phone || phone.trim() === '') {
      return { valid: false, formatted: null, error: 'Numéro de téléphone requis' }
    }

    const cleaned = phone.trim()

    if (!isValidPhoneNumber(cleaned, 'FR')) {
      // Essayer sans code pays (suppose FR par défaut)
      const withPrefix = cleaned.startsWith('+') ? cleaned : `+33${cleaned.replace(/^0/, '')}`
      if (!isValidPhoneNumber(withPrefix)) {
        return {
          valid: false,
          formatted: null,
          error: 'Numéro de téléphone invalide. Utilisez le format international (+33612345678)',
        }
      }
    }

    const parsed = parsePhoneNumberFromString(cleaned, 'FR')
    if (!parsed) {
      return { valid: false, formatted: null, error: 'Impossible de parser le numéro' }
    }

    // WhatsApp ne fonctionne que sur les mobiles
    const type = parsed.getType()
    if (type && type !== 'MOBILE' && type !== 'FIXED_LINE_OR_MOBILE') {
      return {
        valid: false,
        formatted: null,
        error: 'WhatsApp nécessite un numéro de téléphone mobile',
      }
    }

    return {
      valid: true,
      formatted: parsed.format('E.164'), // Ex: +33612345678
      error: null,
    }
  } catch (error) {
    console.error('[WhatsApp] Erreur validation numéro:', error)
    return { valid: false, formatted: null, error: 'Erreur lors de la validation du numéro' }
  }
}

// ===== Templates de messages =====

export type WhatsAppTemplate = 'ticket_approaching' | 'ticket_called'

interface TemplateParams {
  ticketNumber: string
  serviceName?: string
  estimatedTime?: number
  postName?: string
}

function buildMessage(template: WhatsAppTemplate, params: TemplateParams): string {
  switch (template) {
    case 'ticket_approaching':
      return [
        `🎫 *SmartQueue - Votre tour approche !*`,
        ``,
        `Bonjour ! Votre ticket *#${params.ticketNumber}* sera bientôt appelé.`,
        ``,
        params.serviceName ? `📍 Service : ${params.serviceName}` : '',
        params.estimatedTime ? `⏱️ Temps estimé : ~${params.estimatedTime} min` : '',
        ``,
        `Merci de vous présenter à l'accueil.`,
      ]
        .filter(Boolean)
        .join('\n')

    case 'ticket_called':
      return [
        `🔔 *Votre ticket est appelé !*`,
        ``,
        `Ticket *#${params.ticketNumber}*${params.postName ? ` - Rendez-vous au poste *${params.postName}*` : ''}`,
        ``,
        `Merci de vous présenter immédiatement.`,
      ]
        .filter(Boolean)
        .join('\n')

    default:
      return `Votre ticket #${params.ticketNumber} - Veuillez vous présenter à l'accueil.`
  }
}

// ===== Envoi du message WhatsApp =====

export interface SendWhatsAppResult {
  success: boolean
  messageId: string | null
  error: string | null
}

export async function sendWhatsAppMessage(
  to: string,
  template: WhatsAppTemplate,
  params: TemplateParams
): Promise<SendWhatsAppResult> {
  if (!whatsappEnabled) {
    console.log('[WhatsApp] Notifications désactivées (WHATSAPP_ENABLED=false)')
    return { success: false, messageId: null, error: 'WhatsApp notifications disabled' }
  }

  try {
    const { valid, formatted, error: validationError } = validatePhoneNumber(to)
    if (!valid || !formatted) {
      console.warn(`[WhatsApp] Numéro invalide: ${to} - ${validationError}`)
      return { success: false, messageId: null, error: validationError }
    }

    const body = buildMessage(template, params)
    const client = getTwilioClient()

    console.log(`[WhatsApp] Envoi vers ${formatted} | Template: ${template} | Ticket: #${params.ticketNumber}`)

    const message = await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${formatted}`,
      body,
    })

    console.log(`[WhatsApp] ✅ Message envoyé | SID: ${message.sid} | Status: ${message.status}`)

    return {
      success: true,
      messageId: message.sid,
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error(`[WhatsApp] ❌ Erreur envoi:`, errorMessage)

    return {
      success: false,
      messageId: null,
      error: errorMessage,
    }
  }
}

// ===== Utilitaires =====

export function getNotificationThreshold(): number {
  return notificationThreshold
}

export function isWhatsAppEnabled(): boolean {
  return whatsappEnabled
}

export function isWhatsAppConfigured(): boolean {
  return !!(accountSid && authToken && whatsappFrom)
}
