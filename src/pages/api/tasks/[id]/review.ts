import { prisma } from '../../../../lib/prisma'
import { withApiAuth } from '../../../../lib/api'
import { reviewActionSchema, submitForReviewSchema } from '../../../../lib/validators/task'
import { ReviewStatus } from '@prisma/client'

export default withApiAuth(async ({ req, res, session }) => {
  const { id } = req.query
  if (typeof id !== 'string') {
    res.status(400).json({ error: 'INVALID_ID' })
    return
  }

  if (req.method === 'POST') {
    const parsed = submitForReviewSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const task = await prisma.task.update({
      where: { id },
      data: { reviewStatus: 'SUBMITTED', submittedAt: new Date() },
    })

    const review = await prisma.reviewRequest.create({
      data: {
        targetType: 'TASK',
        targetId: id,
        status: ReviewStatus.SUBMITTED,
        submittedById: session.user.id,
        reviewerId: parsed.data.reviewerId,
        notes: parsed.data.notes,
      },
    })

    res.status(201).json({ review, task })
    return
  }

  if (req.method === 'PUT') {
    const parsed = reviewActionSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }

    const review = await prisma.reviewRequest.findFirst({
      where: { targetId: id, targetType: 'TASK', status: ReviewStatus.SUBMITTED },
      orderBy: { createdAt: 'desc' },
    })

    if (!review) {
      res.status(404).json({ error: 'NO_ACTIVE_REVIEW' })
      return
    }

    const status = parsed.data.action === 'APPROVE' ? ReviewStatus.APPROVED : ReviewStatus.CHANGES_REQUESTED

    await prisma.reviewRequest.update({
      where: { id: review.id },
      data: {
        status,
        reviewerId: session.user.id,
        notes: parsed.data.notes,
        respondedAt: new Date(),
      },
    })

    const task = await prisma.task.update({
      where: { id },
      data: {
        reviewStatus: status,
        status: status === ReviewStatus.APPROVED ? 'COMPLETE' : 'IN_PROGRESS',
      },
    })

    res.json({ task, status })
    return
  }

  res.setHeader('Allow', 'POST,PUT')
  res.status(405).end('Method Not Allowed')
}, 'review:action')
