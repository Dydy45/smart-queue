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
