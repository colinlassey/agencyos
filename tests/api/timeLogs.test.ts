import { describe, expect, it, vi } from 'vitest'
import handler from '../../src/pages/api/time-logs/index'
import type { NextApiRequest, NextApiResponse } from 'next'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({ user: { id: 'dev', role: 'DEVELOPER' } })),
}))

const createMock = vi.fn(async () => ({ id: 'log-1' }))

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    timeLog: {
      findMany: vi.fn(async () => []),
      create: createMock,
    },
  },
}))

describe('time log api', () => {
  it('creates a time log', async () => {
    const req = {
      method: 'POST',
      body: { projectId: 'project-1', minutes: 60, entryDate: new Date().toISOString() },
    } as unknown as NextApiRequest
    const status = vi.fn(() => ({ json: vi.fn() }))
    const res = { status, setHeader: vi.fn() } as unknown as NextApiResponse
    await handler(req, res)
    expect(createMock).toHaveBeenCalled()
    expect(status).toHaveBeenCalledWith(201)
  })
})
