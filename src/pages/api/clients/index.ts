import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { withApiAuth } from '../../../lib/api'
import { createClientSchema } from '../../../lib/validators/client'

export default withApiAuth(async ({ req, res }) => {
  if (req.method === 'GET') {
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      include: { projects: { where: { deletedAt: null }, select: { id: true, name: true, dueDate: true } } },
      orderBy: { name: 'asc' },
    })
    res.json({ clients })
    return
  }

  if (req.method === 'POST') {
    const parsed = createClientSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const duplicate = await prisma.client.findFirst({ where: { name: parsed.data.name, deletedAt: null } })
    if (duplicate) {
      res.status(409).json({ error: 'CLIENT_EXISTS' })
      return
    }

    const client = await prisma.client.create({ data: parsed.data })
    res.status(201).json({ client })
    return
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}, 'client:write')
