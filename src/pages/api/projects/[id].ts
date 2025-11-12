import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { updateProjectSchema } from '../../../lib/validators/project'

export default withApiAuth(async ({ req, res }) => {
  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'INVALID_ID' })
    return
  }

  if (req.method === 'GET') {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: {
          where: { deletedAt: null },
          include: { assignments: { include: { user: true } }, feedback: true },
        },
        memberships: { include: { user: true } },
        reviewRequests: true,
        files: { where: { deletedAt: null } },
        timeLogs: true,
      },
    })
    if (!project || project.deletedAt) {
      res.status(404).json({ error: 'NOT_FOUND' })
      return
    }
    res.json({ project })
    return
  }

  if (req.method === 'PUT') {
    const parsed = updateProjectSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
    })
    res.json({ project })
    return
  }

  if (req.method === 'DELETE') {
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date() } })
    res.status(204).end()
    return
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  res.status(405).end('Method Not Allowed')
}, 'project:write')
