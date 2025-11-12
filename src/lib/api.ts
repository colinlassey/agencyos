import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'
import { nextAuthOptions } from './auth'
import { requirePermission } from './rbac'

export const withApiAuth = (
  handler: (params: {
    req: NextApiRequest
    res: NextApiResponse
    session: any
  }) => Promise<void> | void,
  permission?: Parameters<typeof requirePermission>[1],
): NextApiHandler => {
  return async (req, res) => {
    const session = await getServerSession(req, res, nextAuthOptions)
    if (!session || !session.user) {
      res.status(401).json({ error: 'UNAUTHORIZED' })
      return
    }

    const role = (session.user.role ?? 'DEVELOPER') as Role
    try {
      if (permission) {
        requirePermission(role, permission)
      }
    } catch (error) {
      res.status(403).json({ error: 'FORBIDDEN' })
      return
    }

    await handler({ req, res, session })
  }
}
