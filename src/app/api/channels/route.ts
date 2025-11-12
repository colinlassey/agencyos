import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission } from '../../../server/rbac'
import { createChannelSchema } from '../../../server/validators'
import { ChannelType, Role } from '@prisma/client'
import { handleRouteError } from '../../../server/response'

export async function GET() {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'chat:read')

    const channels = await prisma.channel.findMany({
      where: {
        isArchived: false,
        OR: [
          { type: ChannelType.GENERAL },
          { participants: { some: { userId: ctx.userId } } },
          {
            AND: [
              { type: ChannelType.PROJECT },
              ctx.role === Role.CLIENT
                ? {
                    project: {
                      client: {
                        contacts: { some: { userId: ctx.userId } },
                      },
                    },
                  }
                : {
                    project: {
                      memberships: { some: { userId: ctx.userId } },
                    },
                  },
            ],
          },
        ],
      },
      include: {
        participants: { select: { userId: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ channels })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'chat:write')

    const body = await req.json()
    const parsed = createChannelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    const memberIds = Array.from(new Set([...payload.memberIds, ctx.userId]))

    const channel = await prisma.channel.create({
      data: {
        type: payload.type,
        name: payload.name,
        projectId: payload.projectId,
        participants: {
          createMany: {
            data: memberIds.map((userId) => ({ userId })),
            skipDuplicates: true,
          },
        },
      },
      include: {
        participants: true,
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
