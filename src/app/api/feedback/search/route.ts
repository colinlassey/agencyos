import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../server/auth'
import { canAccessClient, canAccessProject, canAccessTask } from '../../../../server/rbac'
import { feedbackSearchSchema } from '../../../../server/validators'
import { FeedbackTargetType, Role } from '@prisma/client'
import { handleRouteError } from '../../../../server/response'

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth()

    const parsed = feedbackSearchSchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { targetType, targetId, includeHidden } = parsed.data

    let allowed = false

    if (targetType === FeedbackTargetType.CLIENT) {
      const client = await prisma.client.findUnique({
        where: { id: targetId, isDeleted: false },
        include: { contacts: { select: { userId: true } } },
      })
      if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      allowed = canAccessClient(ctx, client.contacts.map((c) => c.userId))
    } else if (targetType === FeedbackTargetType.PROJECT) {
      const project = await prisma.project.findUnique({
        where: { id: targetId, isDeleted: false },
        include: {
          memberships: { select: { userId: true } },
          client: { select: { contacts: { select: { userId: true } } } },
        },
      })
      if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      allowed = canAccessProject(ctx, project.memberships.map((m) => m.userId), project.client.contacts.map((c) => c.userId))
    } else {
      const task = await prisma.task.findUnique({
        where: { id: targetId, isDeleted: false },
        include: {
          project: {
            include: {
              memberships: { select: { userId: true } },
              client: { select: { contacts: { select: { userId: true } } } },
            },
          },
        },
      })
      if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      allowed = canAccessTask(
        ctx,
        task.assigneeIds,
        task.project.memberships.map((m) => m.userId),
        task.project.client.contacts.map((c) => c.userId),
      )
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const feedback = await prisma.feedback.findMany({
      where: {
        targetType,
        targetId,
        ...(ctx.role === Role.CLIENT || !includeHidden ? { isClientVisible: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    return handleRouteError(error)
  }
}
