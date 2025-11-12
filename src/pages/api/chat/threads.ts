import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { createThreadSchema } from '../../../lib/validators/chat'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const threads = await prisma.chatThread.findMany({
      where: {
        OR: [
          { type: 'GENERAL' },
          { participants: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        participants: { include: { user: true } },
        project: true,
      },
    })
    res.json({ threads })
    return
  }

  if (req.method === 'POST') {
    const parsed = createThreadSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const thread = await prisma.chatThread.create({
      data: {
        type: parsed.data.type,
        name: parsed.data.name,
        projectId: parsed.data.projectId,
        participants: {
          create: [session.user.id, ...(parsed.data.participantIds ?? [])].map((userId) => ({ userId })),
        },
      },
      include: { participants: true },
    })

    res.status(201).json({ thread })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'chat:write')
