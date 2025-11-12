import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission, canAccessClient, canAccessProject, canAccessTask } from '../../../server/rbac'
import { createFeedbackSchema } from '../../../server/validators'
import { FeedbackTargetType, Role } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'feedback:write')

    const body = await req.json()
    const parsed = createFeedbackSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    let clientId: string | undefined
    let projectId: string | undefined
    let taskId: string | undefined
    let canWrite = false

    if (payload.targetType === FeedbackTargetType.CLIENT) {
      const client = await prisma.client.findUnique({
        where: { id: payload.targetId, isDeleted: false },
        include: { contacts: { select: { userId: true } } },
      })
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      canWrite = canAccessClient(ctx, client.contacts.map((c) => c.userId))
      clientId = client.id
    } else if (payload.targetType === FeedbackTargetType.PROJECT) {
      const project = await prisma.project.findUnique({
        where: { id: payload.targetId, isDeleted: false },
        include: {
          memberships: { select: { userId: true } },
          client: { select: { contacts: { select: { userId: true } } } },
        },
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      canWrite = canAccessProject(ctx, project.memberships.map((m) => m.userId), project.client.contacts.map((c) => c.userId))
      projectId = project.id
      clientId = project.clientId
    } else {
      const task = await prisma.task.findUnique({
        where: { id: payload.targetId, isDeleted: false },
        include: {
          project: {
            include: {
              memberships: { select: { userId: true } },
              client: { select: { contacts: { select: { userId: true } } } },
            },
          },
        },
      })
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      canWrite = canAccessTask(
        ctx,
        task.assigneeIds,
        task.project.memberships.map((m) => m.userId),
        task.project.client.contacts.map((c) => c.userId),
      )
      taskId = task.id
      projectId = task.projectId
      clientId = task.project.clientId
    }

    if (!canWrite) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const feedback = await prisma.feedback.create({
      data: {
        targetType: payload.targetType,
        targetId: payload.targetId,
        content: payload.content,
        isClientVisible: ctx.role === Role.CLIENT ? true : payload.isClientVisible,
        authorId: ctx.userId,
        clientId,
        projectId,
        taskId,
      },
    })

    return NextResponse.json({ feedback }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
