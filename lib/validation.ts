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
