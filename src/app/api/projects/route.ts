import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission } from '../../../server/rbac'
import { createProjectSchema } from '../../../server/validators'
import { Role } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function GET() {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'project:read')

    const projects = await prisma.project.findMany({
      where: {
        isDeleted: false,
        ...(ctx.role === Role.CLIENT
          ? {
              client: {
                contacts: {
                  some: {
                    userId: ctx.userId,
                  },
                },
              },
            }
          : ctx.role === Role.DEVELOPER
          ? {
              memberships: {
                some: { userId: ctx.userId },
              },
            }
          : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        tasks: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'project:write')

    const body = await req.json()
    const parsed = createProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    const project = await prisma.project.create({
      data: {
        name: payload.name.trim(),
        clientId: payload.clientId,
        stage: payload.stage,
        priority: payload.priority,
        dueDate: payload.dueDate,
        description: payload.description,
        memberships: ctx.role === Role.DEVELOPER || ctx.role === Role.ADMIN ? { create: { userId: ctx.userId, role: ctx.role } } : undefined,
      },
      include: { client: true },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
