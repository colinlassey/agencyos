import { describe, expect, it, beforeEach, vi } from 'vitest'
import { POST, GET } from '../../src/app/api/timelogs/route'
import { Role } from '@prisma/client'

const mockRequireAuth = vi.fn()
const mockTimeLogCreate = vi.fn()
const mockTimeLogFindMany = vi.fn()

vi.mock('../../src/server/auth', () => ({
  requireAuth: () => mockRequireAuth(),
}))

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    task: { findUnique: vi.fn() },
    timeLog: {
      create: (...args: any[]) => mockTimeLogCreate(...args),
      findMany: (...args: any[]) => mockTimeLogFindMany(...args),
    },
  },
}))

describe('timelog api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a time log for a project', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'dev-1', role: Role.DEVELOPER })
    mockTimeLogCreate.mockResolvedValue({ id: 'log-1' })

    const response = await POST(
      new Request('http://localhost/api/timelogs', {
        method: 'POST',
        body: JSON.stringify({ targetType: 'PROJECT', targetId: 'project-1', projectId: 'project-1', hours: 2, date: new Date().toISOString() }),
      }) as any,
    )

    expect(response.status).toBe(201)
    expect(mockTimeLogCreate).toHaveBeenCalled()
  })

  it('returns weekly rollup data', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'admin', role: Role.ADMIN })
    mockTimeLogFindMany.mockResolvedValue([
      {
        id: 'log-1',
        memberId: 'dev-1',
        date: new Date('2024-03-04T00:00:00Z'),
        hours: 4,
        member: { id: 'dev-1', name: 'Dev One', email: 'dev@example.com', capacityHrsPerWeek: 30 },
      },
    ])

    const response = await GET(new Request('http://localhost/api/timelogs') as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.weekly[0].hours).toBe(4)
    expect(mockTimeLogFindMany).toHaveBeenCalled()
  })
})
