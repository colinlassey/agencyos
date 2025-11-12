import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission, canAccessClient, canAccessProject } from '../../../server/rbac'
import { fileQuerySchema } from '../../../server/validators'
import { Role } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'file:read')

    const parsed = fileQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { clientId, projectId } = parsed.data

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId, isDeleted: false },
        include: { contacts: { select: { userId: true } } },
      })
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      if (!canAccessClient(ctx, client.contacts.map((c) => c.userId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, isDeleted: false },
        include: {
          memberships: { select: { userId: true } },
          client: { select: { contacts: { select: { userId: true } } } },
        },
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      if (!canAccessProject(ctx, project.memberships.map((m) => m.userId), project.client.contacts.map((c) => c.userId))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const files = await prisma.file.findMany({
      where: {
        isDeleted: false,
        ...(clientId ? { clientId } : {}),
        ...(projectId ? { projectId } : {}),
        ...(ctx.role === Role.CLIENT
          ? {
              isDeleted: false,
            }
          : {}),
      },
      orderBy: [{ clientId: 'asc' }, { projectId: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ files })
  } catch (error) {
    return handleRouteError(error)
  }
}
