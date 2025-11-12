import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../server/auth'
import { assertPermission } from '../../../../server/rbac'
import { reviewDecisionSchema } from '../../../../server/validators'
import { NotificationType, ReviewStatus, TaskStatus } from '@prisma/client'
import { handleRouteError } from '../../../../server/response'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'review:write')

    const body = await req.json()
    const parsed = reviewDecisionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const review = await prisma.reviewSubmission.findUnique({
      where: { id: params.id },
      include: {
        task: true,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (review.status !== ReviewStatus.PENDING) {
      return NextResponse.json({ error: 'Review already completed' }, { status: 400 })
    }

    const nextTaskStatus = parsed.data.status === 'APPROVED' ? TaskStatus.DONE : TaskStatus.DOING

    const [updatedReview, updatedTask] = await prisma.$transaction([
      prisma.reviewSubmission.update({
        where: { id: params.id },
        data: {
          status: parsed.data.status,
          reviewerId: ctx.userId,
          notes: parsed.data.notes,
          respondedAt: new Date(),
        },
      }),
      prisma.task.update({
        where: { id: review.taskId },
        data: {
          status: nextTaskStatus,
        },
      }),
    ])

    await prisma.notification.createMany({
      data: (review.task.assigneeIds ?? []).map((assigneeId) => ({
        type: NotificationType.REVIEW_STATUS,
        userId: assigneeId,
        payload: {
          kind: parsed.data.status === 'APPROVED' ? 'review-approved' : 'review-changes-requested',
          taskId: review.taskId,
          reviewerId: ctx.userId,
        },
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({ review: updatedReview, task: updatedTask })
  } catch (error) {
    return handleRouteError(error)
  }
}
