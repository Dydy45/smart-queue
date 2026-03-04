import { currentUser } from '@clerk/nextjs/server'

/**
 * Get the currently authenticated user's email
 * Returns null if no user is authenticated
 */
export async function getCurrentUserEmail(): Promise<string | null> {
    try {
        const user = await currentUser()
        return user?.primaryEmailAddress?.emailAddress || null
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}

/**
 * Verify that the requested email belongs to the authenticated user
 * Throws an error if:
 * - User is not authenticated
 * - The authenticated user's email doesn't match the requested email
 *
 * @param requestedEmail - The email that is being requested/modified
 * @throws {Error} If user is not authenticated or doesn't match
 */
export async function verifyCompanyOwnership(requestedEmail: string): Promise<void> {
    const userEmail = await getCurrentUserEmail()

    if (!userEmail) {
        throw new Error('Utilisateur non authentifié')
    }

    if (userEmail.toLowerCase() !== requestedEmail.toLowerCase()) {
        throw new Error('Vous n\'avez pas accès à cette entreprise')
    }
}

/**
 * Middleware to check if user is authenticated
 * Throws an error if not
 */
export async function requireAuth(): Promise<string> {
    const userEmail = await getCurrentUserEmail()

    if (!userEmail) {
        throw new Error('Authentification requise')
    }

    return userEmail
}

/**
 * Vérifie si l'utilisateur a accès à une entreprise (propriétaire OU staff)
 * Retourne le rôle et l'ID de l'entreprise
 * 
 * @param requestedEmail - Email du propriétaire de l'entreprise
 * @returns { role: 'OWNER' | 'ADMIN' | 'STAFF', companyId: string, staffId?: string }
 * @throws {Error} Si l'utilisateur n'a pas accès
 */
export async function verifyStaffAccess(requestedEmail: string): Promise<{
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    companyId: string
    staffId?: string
}> {
    const userEmail = await getCurrentUserEmail()

    if (!userEmail) {
        throw new Error('Utilisateur non authentifié')
    }

    // Import prisma ici pour éviter les dépendances circulaires
    const { default: prisma } = await import('@/lib/prisma')

    // 1. Vérifier si c'est le propriétaire
    const company = await prisma.company.findUnique({
        where: { email: requestedEmail }
    })

    if (!company) {
        throw new Error('Entreprise non trouvée')
    }

    if (userEmail.toLowerCase() === requestedEmail.toLowerCase()) {
        return { role: 'OWNER', companyId: company.id }
    }

    // 2. Vérifier si c'est un staff de cette entreprise
    const staff = await prisma.staff.findUnique({
        where: {
            email_companyId: {
                email: userEmail,
                companyId: company.id
            }
        }
    })

    if (staff) {
        return { role: staff.role, companyId: company.id, staffId: staff.id }
    }

    // 3. Aucun accès
    throw new Error('Vous n\'avez pas accès à cette entreprise')
}
