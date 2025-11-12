import { describe, expect, it, vi } from 'vitest'
import handler from '../../src/pages/api/tasks/[id]/review'
import type { NextApiRequest, NextApiResponse } from 'next'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({ user: { id: 'admin', role: 'ADMIN' } })),
}))

const updateMock = vi.fn(async () => ({ id: 'task-1', reviewStatus: 'SUBMITTED', status: 'IN_PROGRESS' }))
const createMock = vi.fn(async () => ({ id: 'review-1' }))
const findFirstMock = vi.fn(async () => ({ id: 'review-1', status: 'SUBMITTED' }))

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    task: { update: updateMock },
    reviewRequest: {
      create: createMock,
      findFirst: findFirstMock,
      update: vi.fn(async () => ({})),
    },
  },
}))

describe('task review api', () => {
  it('submits for review', async () => {
    const req = { method: 'POST', query: { id: 'task-1' }, body: {} } as unknown as NextApiRequest
    const status = vi.fn(() => ({ json: vi.fn() }))
    const res = { status, setHeader: vi.fn() } as unknown as NextApiResponse
    await handler(req, res)
    expect(updateMock).toHaveBeenCalled()
    expect(createMock).toHaveBeenCalled()
  })

  it('approves review', async () => {
    const req = { method: 'PUT', query: { id: 'task-1' }, body: { action: 'APPROVE' } } as unknown as NextApiRequest
    const json = vi.fn()
    const res = { status: vi.fn(() => ({ json })), setHeader: vi.fn() } as unknown as NextApiResponse
    await handler(req, res)
    expect(findFirstMock).toHaveBeenCalled()
  })
})
