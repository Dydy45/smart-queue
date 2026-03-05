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
 * Vérifie si l'utilisateur connecté a accès à une entreprise (propriétaire OU staff)
 * Ne prend AUCUN paramètre : identifie automatiquement l'utilisateur via Clerk
 * 
 * @returns { role: 'OWNER' | 'ADMIN' | 'STAFF', companyId: string, staffId?: string }
 * @throws {Error} Si l'utilisateur n'est pas authentifié ou n'a accès à aucune entreprise
 */
export async function verifyStaffAccess(): Promise<{
    role: 'OWNER' | 'ADMIN' | 'STAFF'
    companyId: string
    staffId?: string
}> {
    const userEmail = await getCurrentUserEmail()

    if (!userEmail) {
        throw new Error('Utilisateur non authentifié')
    }

    const { default: prisma } = await import('@/lib/prisma')

    // 1. Vérifier si c'est le propriétaire d'une entreprise
    const company = await prisma.company.findUnique({
        where: { email: userEmail }
    })

    if (company) {
        return { role: 'OWNER', companyId: company.id }
    }

    // 2. Vérifier si c'est un employé (staff) d'une entreprise
    const staff = await prisma.staff.findFirst({
        where: { email: userEmail }
    })

    if (staff) {
        return { role: staff.role, companyId: staff.companyId, staffId: staff.id }
    }

    // 3. Aucun accès
    throw new Error('Accès refusé : vous n\'êtes ni propriétaire ni employé d\'une entreprise')
}
