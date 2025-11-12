import { describe, expect, it, beforeEach, vi } from 'vitest'
import { POST } from '../../src/app/api/clients/route'
import { Role } from '@prisma/client'

const mockRequireAuth = vi.fn()
const mockClientCreate = vi.fn(async (args: any) => ({ id: 'client-1', ...args.data }))

vi.mock('../../src/server/auth', () => ({
  requireAuth: () => mockRequireAuth(),
}))

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    client: {
      findMany: vi.fn(async () => []),
      create: (...args: any[]) => mockClientCreate(...args),
    },
  },
}))

describe('clients api', () => {
  beforeEach(() => {
    mockRequireAuth.mockReset()
    mockClientCreate.mockClear()
  })

  it('creates a client with normalized name', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'user-1', role: Role.ADMIN })

    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme Co', domain: 'acme.test', priority: 'HIGH' }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.client.name).toBe('Acme Co')
    expect(mockClientCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nameNormalized: 'acme co' }),
      }),
    )
  })

  it('blocks client role from creating clients', async () => {
    mockRequireAuth.mockResolvedValue({ userId: 'client-1', role: Role.CLIENT })

    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', domain: 'acme.test' }),
    })

    const response = await POST(request as any)
    expect(response.status).toBe(403)
  })
})
