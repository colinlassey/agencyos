import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { createTaskSchema } from '../../../lib/validators/task'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const tasks = await prisma.task.findMany({
      where: { deletedAt: null },
      include: {
        project: true,
        assignments: { include: { user: true } },
        feedback: true,
      },
      orderBy: { dueDate: 'asc' },
    })
    res.json({ tasks })
    return
  }

  if (req.method === 'POST') {
    const parsed = createTaskSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const task = await prisma.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        reviewStatus: parsed.data.reviewStatus,
        priority: parsed.data.priority,
        estimateHours: parsed.data.estimateHours,
        dueDate: new Date(parsed.data.dueDate),
        projectId: parsed.data.projectId,
        createdById: session.user.id,
        assignments: {
          create: parsed.data.assigneeIds.map((userId) => ({ userId })),
        },
      },
      include: { assignments: true },
    })

    res.status(201).json({ task })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'task:write')
