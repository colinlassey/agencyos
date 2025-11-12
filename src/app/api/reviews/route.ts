import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission, canAccessTask } from '../../../server/rbac'
import { submitForReviewSchema } from '../../../server/validators'
import { NotificationType, ReviewStatus, TaskStatus } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'review:write')

    const body = await req.json()
    const parsed = submitForReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    const task = await prisma.task.findUnique({
      where: { id: payload.taskId, isDeleted: false },
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

    const allowed = canAccessTask(
      ctx,
      task.assigneeIds,
      task.project.memberships.map((m) => m.userId),
      task.project.client.contacts.map((c) => c.userId),
    )
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (task.status !== TaskStatus.DOING) {
      return NextResponse.json({ error: 'Task must be in DOING to request review' }, { status: 400 })
    }

    const [review] = await prisma.$transaction([
      prisma.reviewSubmission.create({
        data: {
          projectId: task.projectId,
          taskId: task.id,
          status: ReviewStatus.PENDING,
          submittedById: ctx.userId,
          reviewerId: payload.reviewerId,
          notes: payload.notes,
        },
      }),
      prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.REVIEW },
      }),
    ])

    if (payload.reviewerId) {
      await prisma.notification.create({
        data: {
          type: NotificationType.REVIEW_STATUS,
          userId: payload.reviewerId,
          payload: {
            kind: 'review-request',
            taskId: task.id,
            projectId: task.projectId,
            submittedBy: ctx.userId,
          },
        },
      })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
