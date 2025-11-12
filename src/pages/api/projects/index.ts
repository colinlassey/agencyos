import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { createProjectSchema } from '../../../lib/validators/project'

export default withApiAuth(async ({ req, res, session }) => {
  if (req.method === 'GET') {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        client: true,
        tasks: {
          where: { deletedAt: null },
          select: { id: true, status: true, priority: true, dueDate: true, estimateHours: true },
        },
        memberships: { include: { user: true } },
      },
      orderBy: { dueDate: 'asc' },
    })
    res.json({ projects })
    return
  }

  if (req.method === 'POST') {
    const parsed = createProjectSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        dueDate: new Date(parsed.data.dueDate),
        stage: parsed.data.stage,
        priority: parsed.data.priority,
        clientId: parsed.data.clientId,
        createdById: session.user.id,
        memberships: {
          create: parsed.data.assigneeIds.map((userId) => ({ userId, role: 'DEVELOPER' })),
        },
      },
    })

    res.status(201).json({ project })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'project:write')
