import { startOfWeek } from 'date-fns'
import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { createTimeLogSchema } from '../../../lib/validators/timeLog'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const { userId, week } = req.query
    const logs = await prisma.timeLog.findMany({
      where: {
        userId: typeof userId === 'string' ? userId : session.user.id,
        weekStart: week ? new Date(String(week)) : undefined,
      },
      include: { project: true, task: true },
      orderBy: { entryDate: 'desc' },
    })
    res.json({ logs })
    return
  }

  if (req.method === 'POST') {
    const parsed = createTimeLogSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const entryDate = new Date(parsed.data.entryDate)
    const log = await prisma.timeLog.create({
      data: {
        ...parsed.data,
        entryDate,
        weekStart: startOfWeek(entryDate, { weekStartsOn: 1 }),
        userId: session.user.id,
      },
    })

    res.status(201).json({ log })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'timelog:write')
