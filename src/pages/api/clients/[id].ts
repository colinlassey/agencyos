import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { updateClientSchema } from '../../../lib/validators/client'

export default withApiAuth(async ({ req, res }) => {
  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'INVALID_ID' })
    return
  }

  if (req.method === 'GET') {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: { where: { deletedAt: null }, include: { tasks: true } },
        feedback: true,
      },
    })
    if (!client || client.deletedAt) {
      res.status(404).json({ error: 'NOT_FOUND' })
      return
    }
    res.json({ client })
    return
  }

  if (req.method === 'PUT') {
    const parsed = updateClientSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }
    const client = await prisma.client.update({ where: { id }, data: parsed.data })
    res.json({ client })
    return
  }

  if (req.method === 'DELETE') {
    await prisma.client.update({ where: { id }, data: { deletedAt: new Date() } })
    res.status(204).end()
    return
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  res.status(405).end('Method Not Allowed')
}, 'client:write')
