import { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { nextAuthOptions } from '../lib/auth'
import type { AuthContext } from './rbac'

export async function requireAuth(): Promise<AuthContext> {
  const session = await getServerSession(nextAuthOptions)

  if (!session?.user?.id) {
    const error = new Error('Unauthorized')
    ;(error as any).status = 401
    throw error
  }

  const role = ((session.user as any).role as Role) ?? Role.DEVELOPER

  return {
    userId: session.user.id,
    role,
  }
}
