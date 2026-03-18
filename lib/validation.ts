import { z } from 'zod'

/**
 * Service name validation schema
 * Used when creating or updating services
 */
export const serviceNameSchema = z
  .string()
  .min(1, 'Le nom du service ne peut pas être vide')
  .max(50, 'Le nom du service ne peut pas dépasser 50 caractères')
  .trim()

/**
 * Page name validation schema
 * Used when setting up company page name
 * Alphanumeric, hyphens, and underscores only
 */
export const pageNameSchema = z
  .string()
  .min(3, 'Le nom de page doit contenir au moins 3 caractères')
  .max(30, 'Le nom de page ne peut pas dépasser 30 caractères')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom de page ne peut contenir que des lettres, chiffres, tirets et underscores')
  .toLowerCase()

/**
 * Customer name validation schema
 * Used when creating tickets
 */
export const customerNameSchema = z
  .string()
  .min(1, 'Le nom du client ne peut pas être vide')
  .max(100, 'Le nom du client ne peut pas dépasser 100 caractères')
  .trim()

/**
 * Post name validation schema
 * Used when creating posts
 */
export const postNameSchema = z
  .string()
  .min(1, 'Le nom du poste ne peut pas être vide')
  .max(50, 'Le nom du poste ne peut pas dépasser 50 caractères')
  .trim()

/**
 * Average time validation schema
 * Used when creating services
 * Must be a positive integer in minutes
 */
export const avgTimeSchema = z
  .number()
  .int('Le temps moyen doit être un nombre entier')
  .min(1, 'Le temps moyen doit être supérieur à 0')
  .max(1440, 'Le temps moyen ne peut pas dépasser 1440 minutes (24 heures)')

/**
 * Email validation schema
 * Standard email validation
 */
export const emailSchema = z
  .string()
  .email('Email invalide')
  .toLowerCase()

/**
 * Service ID validation schema
 * UUID validation for service IDs
 */
export const serviceIdSchema = z
  .string()
  .uuid('ID de service invalide')

/**
 * Post ID validation schema
 * UUID validation for post IDs
 */
export const postIdSchema = z
  .string()
  .uuid('ID de poste invalide')

/**
 * Ticket ID validation schema
 * UUID validation for ticket IDs
 */
export const ticketIdSchema = z
  .string()
  .uuid('ID de ticket invalide')

/**
 * Ticket status validation schema
 * Allowed ticket statuses
 */
export const ticketStatusSchema = z
  .enum(['PENDING', 'CALL', 'IN_PROGRESS', 'FINISHED'])
  .default('PENDING')

/**
 * Feedback validation schema
 * Used when submitting client feedback after service
 */
export const feedbackSchema = z.object({
  ticketId: z.string().uuid('ID de ticket invalide'),
  rating: z
    .number()
    .int('La note doit être un nombre entier')
    .min(1, 'La note minimum est 1')
    .max(5, 'La note maximum est 5'),
  comment: z
    .string()
    .max(500, 'Le commentaire ne peut pas dépasser 500 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

/**
 * Appointment validation schema
 * Used when creating a new appointment
 */
export const appointmentSchema = z.object({
  serviceId: z.string().uuid('ID de service invalide'),
  postId: z.string().uuid('ID de poste invalide').optional(),
  clientName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  clientEmail: z
    .string()
    .email('Email invalide')
    .toLowerCase()
    .optional()
    .or(z.literal('')),
  clientPhone: z
    .string()
    .max(20, 'Numéro trop long')
    .optional()
    .or(z.literal('')),
  appointmentDate: z.string().datetime('Date de rendez-vous invalide'),
  duration: z
    .number()
    .int('La durée doit être un nombre entier')
    .min(5, 'La durée minimum est de 5 minutes')
    .max(480, 'La durée maximum est de 8 heures'),
  notes: z
    .string()
    .max(500, 'Les notes ne peuvent pas dépasser 500 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>

/**
 * Business hours validation schema
 * Used when configuring weekly opening hours
 */
export const businessHoursSchema = z.object({
  dayOfWeek: z
    .number()
    .int()
    .min(0, 'Jour invalide (0=Dimanche)')
    .max(6, 'Jour invalide (6=Samedi)'),
  openTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format horaire invalide (HH:mm)'),
  closeTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format horaire invalide (HH:mm)'),
  isOpen: z.boolean(),
})

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>

/**
 * Closed date validation schema
 * Used when adding exceptional closing days
 */
export const closedDateSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)'),
  reason: z
    .string()
    .max(200, 'La raison ne peut pas dépasser 200 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
})

export type ClosedDateInput = z.infer<typeof closedDateSchema>

/**
 * Company theme validation schema
 * Used when updating branding / visual identity
 */
export const themeSchema = z.object({
  logoUrl: z
    .string()
    .url('URL de logo invalide')
    .max(500, 'URL trop longue')
    .optional()
    .or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Couleur invalide (format #RRGGBB)')
    .optional()
    .or(z.literal('')),
  accentColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Couleur invalide (format #RRGGBB)')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(300, 'La description ne peut pas dépasser 300 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
})

export type ThemeInput = z.infer<typeof themeSchema>
