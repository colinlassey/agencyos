import { describe, expect, it, vi } from 'vitest'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '../../src/pages/api/clients/index'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({ user: { id: 'user-1', role: 'ADMIN' } })),
}))

vi.mock('../../src/lib/prisma', () => {
  return {
    prisma: {
      client: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async (args) => ({ id: 'client-1', ...args.data })),
      },
    },
  }
})

describe('clients api', () => {
  it('creates a client', async () => {
    const req = { method: 'POST', body: { name: 'Acme', stage: 'ACTIVE', priority: 'HIGH' } } as unknown as NextApiRequest
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status, setHeader: vi.fn() } as unknown as NextApiResponse
    await handler(req, res)
    expect(status).toHaveBeenCalledWith(201)
  })
})
