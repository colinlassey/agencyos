import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { createMessageSchema } from '../../../lib/validators/chat'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const { threadId } = req.query
    if (typeof threadId !== 'string') {
      res.status(400).json({ error: 'INVALID_THREAD' })
      return
    }

    const messages = await prisma.chatMessage.findMany({
      where: { threadId },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    })
    res.json({ messages })
    return
  }

  if (req.method === 'POST') {
    const parsed = createMessageSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const thread = await prisma.chatThread.findUnique({
      where: { id: parsed.data.threadId },
      include: { participants: true },
    })
    if (!thread) {
      res.status(404).json({ error: 'THREAD_NOT_FOUND' })
      return
    }

    const isParticipant = thread.type === 'GENERAL' || thread.participants.some((p) => p.userId === session.user.id)
    if (!isParticipant) {
      res.status(403).json({ error: 'NOT_PARTICIPANT' })
      return
    }

    const message = await prisma.chatMessage.create({
      data: {
        threadId: parsed.data.threadId,
        authorId: session.user.id,
        content: parsed.data.content,
      },
    })

    res.status(201).json({ message })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'chat:write')
