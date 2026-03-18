'use server'

import prisma from '@/lib/prisma'
import { verifyStaffAccess } from '@/lib/auth'
import { themeSchema } from '@/lib/validation'
import type { ThemeInput } from '@/lib/validation'

/**
 * Récupère le thème d'une entreprise par pageName (route publique).
 */
export async function getCompanyTheme(pageName: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { pageName },
      select: {
        name: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        description: true,
      }
    })

    if (!company) return null

    return {
      name: company.name,
      logoUrl: company.logoUrl,
      primaryColor: company.primaryColor || '#6419E6',
      accentColor: company.accentColor || '#D926A9',
      description: company.description,
    }
  } catch (error) {
    console.error('[getCompanyTheme] Erreur:', error)
    return null
  }
}

/**
 * Récupère le thème pour OWNER/ADMIN (via auth).
 */
export async function getMyCompanyTheme() {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      throw new Error('Accès réservé aux OWNER/ADMIN')
    }

    const company = await prisma.company.findUnique({
      where: { id: access.companyId },
      select: {
        name: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
        description: true,
      }
    })

    if (!company) throw new Error('Entreprise introuvable')

    return {
      name: company.name,
      logoUrl: company.logoUrl || '',
      primaryColor: company.primaryColor || '',
      accentColor: company.accentColor || '',
      description: company.description || '',
    }
  } catch (error) {
    console.error('[getMyCompanyTheme] Erreur:', error)
    throw error
  }
}

/**
 * Met à jour le thème de l'entreprise (OWNER/ADMIN).
 */
export async function updateCompanyTheme(
  data: ThemeInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const access = await verifyStaffAccess()
    if (access.role === 'STAFF') {
      return { success: false, error: 'Accès réservé aux OWNER/ADMIN' }
    }

    const validated = themeSchema.parse(data)

    await prisma.company.update({
      where: { id: access.companyId },
      data: {
        logoUrl: validated.logoUrl || null,
        primaryColor: validated.primaryColor || null,
        accentColor: validated.accentColor || null,
        description: validated.description || null,
      }
    })

    return { success: true }
  } catch (error) {
    console.error('[updateCompanyTheme] Erreur:', error)
    return { success: false, error: 'Une erreur est survenue lors de la mise à jour du thème' }
  }
}
