import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission, canAccessProject } from '../../../server/rbac'
import { createTaskSchema } from '../../../server/validators'
import { Role } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'task:read')

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId') ?? undefined
    const status = searchParams.get('status') ?? undefined

    const tasks = await prisma.task.findMany({
      where: {
        isDeleted: false,
        ...(projectId ? { projectId } : {}),
        ...(status ? { status: status as any } : {}),
        ...(ctx.role === Role.CLIENT
          ? {
              project: {
                client: {
                  contacts: {
                    some: { userId: ctx.userId },
                  },
                },
              },
            }
          : ctx.role === Role.DEVELOPER
          ? {
              project: {
                memberships: {
                  some: { userId: ctx.userId },
                },
              },
            }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true, clientId: true } },
        feedback: {
          where: { isClientVisible: ctx.role === Role.CLIENT ? true : undefined },
        },
      },
      orderBy: [{ projectId: 'asc' }, { orderIndex: 'asc' }],
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'task:write')

    const body = await req.json()
    const parsed = createTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
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

    const task = await prisma.task.create({
      data: {
        title: payload.title.trim(),
        description: payload.description,
        projectId: payload.projectId,
        status: payload.status,
        priority: payload.priority,
        dueDate: payload.dueDate,
        estimateHrs: payload.estimateHrs,
        orderIndex: payload.orderIndex ?? 0,
        assigneeIds: payload.assigneeIds ?? [],
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
