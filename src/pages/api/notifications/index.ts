import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ notifications })
    return
  }

  if (req.method === 'PATCH') {
    const { ids } = req.body as { ids: string[] }
    await prisma.notification.updateMany({
      where: { id: { in: ids ?? [] }, userId: session.user.id },
      data: { readAt: new Date() },
    })
    res.status(204).end()
    return
  }

  res.setHeader('Allow', 'GET,PATCH')
  res.status(405).end('Method Not Allowed')
}, 'notification:read')
