import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission } from '../../../server/rbac'
import { createClientSchema } from '../../../server/validators'
import { Role } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function GET() {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'client:read')

    const clients = await prisma.client.findMany({
      where: {
        isDeleted: false,
        ...(ctx.role === Role.CLIENT
          ? {
              contacts: {
                some: {
                  userId: ctx.userId,
                },
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: {
        projects: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            stage: true,
            priority: true,
            dueDate: true,
          },
        },
        contacts: {
          select: { userId: true },
        },
      },
    })

    return NextResponse.json({ clients })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'client:write')

    const body = await req.json()
    const parsed = createClientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const nameNormalized = payload.name.trim().toLowerCase()

    const client = await prisma.client.create({
      data: {
        name: payload.name.trim(),
        nameNormalized,
        domain: payload.domain?.toLowerCase(),
        stage: payload.stage,
        priority: payload.priority,
        notes: payload.notes,
        contacts: {
          create: {
            userId: ctx.userId,
          },
        },
      },
    })

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
