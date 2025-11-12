import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { updateTaskSchema } from '../../../lib/validators/task'

export default withApiAuth(async ({ req, res }) => {
  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'INVALID_ID' })
    return
  }

  if (req.method === 'GET') {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignments: { include: { user: true } },
        feedback: true,
        reviewRequests: true,
      },
    })
    if (!task || task.deletedAt) {
      res.status(404).json({ error: 'NOT_FOUND' })
      return
    }
    res.json({ task })
    return
  }

  if (req.method === 'PUT') {
    const parsed = updateTaskSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        assignments: parsed.data.assigneeIds
          ? {
              deleteMany: {},
              create: parsed.data.assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: { assignments: true },
    })
    res.json({ task })
    return
  }

  if (req.method === 'DELETE') {
    await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })
    res.status(204).end()
    return
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  res.status(405).end('Method Not Allowed')
}, 'task:write')
