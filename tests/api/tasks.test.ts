import { describe, expect, it, beforeEach, vi } from 'vitest'
import { POST as submitReview } from '../../src/app/api/reviews/route'
import { PATCH as reviewDecision } from '../../src/app/api/reviews/[id]/route'
import { Role, TaskStatus } from '@prisma/client'

const mockRequireAuth = vi.fn()
const mockTaskFindUnique = vi.fn()
const mockReviewCreate = vi.fn()
const mockTaskUpdate = vi.fn()
const mockNotificationCreate = vi.fn()
const mockReviewFindUnique = vi.fn()
const mockReviewUpdate = vi.fn()
const mockNotificationCreateMany = vi.fn()

vi.mock('../../src/server/auth', () => ({
  requireAuth: () => mockRequireAuth(),
}))

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    $transaction: (operations: any[]) => Promise.all(operations),
    task: {
      findUnique: (...args: any[]) => mockTaskFindUnique(...args),
      update: (...args: any[]) => mockTaskUpdate(...args),
    },
    reviewSubmission: {
      create: (...args: any[]) => mockReviewCreate(...args),
      findUnique: (...args: any[]) => mockReviewFindUnique(...args),
      update: (...args: any[]) => mockReviewUpdate(...args),
    },
    notification: {
      create: (...args: any[]) => mockNotificationCreate(...args),
      createMany: (...args: any[]) => mockNotificationCreateMany(...args),
    },
  },
}))

describe('review flow api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits a task for review', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'dev-1', role: Role.DEVELOPER })
    mockTaskFindUnique.mockResolvedValue({
      id: 'task-1',
      status: TaskStatus.DOING,
      assigneeIds: ['dev-1'],
      projectId: 'project-1',
      project: {
        memberships: [{ userId: 'dev-1' }],
        client: { contacts: [] },
      },
    })
    mockReviewCreate.mockResolvedValue({ id: 'review-1' })
    mockTaskUpdate.mockResolvedValue({ id: 'task-1', status: TaskStatus.REVIEW })

    const response = await submitReview(
      new Request('http://localhost/api/reviews', {
        method: 'POST',
        body: JSON.stringify({ taskId: 'task-1', reviewerId: 'admin-1' }),
      }) as any,
    )

    expect(response.status).toBe(201)
    expect(mockReviewCreate).toHaveBeenCalled()
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'admin-1' }),
      }),
    )
  })

  it('approves a pending review', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'admin-1', role: Role.ADMIN })
    mockReviewFindUnique.mockResolvedValue({
      id: 'review-1',
      status: 'PENDING',
      taskId: 'task-1',
      task: { assigneeIds: ['dev-1'] },
    })
    mockReviewUpdate.mockResolvedValue({ id: 'review-1', status: 'APPROVED' })
    mockTaskUpdate.mockResolvedValue({ id: 'task-1', status: TaskStatus.DONE })

    const response = await reviewDecision(
      new Request('http://localhost/api/reviews/review-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'APPROVED' }),
      }) as any,
      { params: { id: 'review-1' } },
    )

    expect(response.status).toBe(200)
    expect(mockReviewUpdate).toHaveBeenCalled()
    expect(mockNotificationCreateMany).toHaveBeenCalled()
  })
})
