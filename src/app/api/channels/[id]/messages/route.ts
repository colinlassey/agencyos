import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth } from '../../../../../server/auth'
import { assertPermission } from '../../../../../server/rbac'
import { channelMessageSchema } from '../../../../../server/validators'
import { Role } from '@prisma/client'
import { handleRouteError } from '../../../../../server/response'

async function ensureAccess(channelId: string, userId: string, role: Role) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId, isArchived: false },
    include: {
      participants: { select: { userId: true } },
      project: {
        include: {
          memberships: { select: { userId: true } },
          client: { select: { contacts: { select: { userId: true } } } },
        },
      },
    },
  })

  if (!channel) {
    return { channel: null, allowed: false }
  }

  if (channel.type === 'GENERAL') {
    return { channel, allowed: true }
  }

  if (channel.participants.some((p) => p.userId === userId)) {
    return { channel, allowed: true }
  }

  if (channel.type === 'PROJECT' && channel.project) {
    if (role === Role.CLIENT) {
      const allowed = channel.project.client.contacts.some((c) => c.userId === userId)
      return { channel, allowed }
    }
    const allowed = channel.project.memberships.some((m) => m.userId === userId)
    return { channel, allowed }
  }

  return { channel, allowed: false }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'chat:read')

    const { channel, allowed } = await ensureAccess(params.id, ctx.userId, ctx.role)
    if (!channel || !allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: channel ? 403 : 404 })
    }

    const messages = await prisma.message.findMany({
      where: { channelId: channel.id },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'chat:write')

    const { channel, allowed } = await ensureAccess(params.id, ctx.userId, ctx.role)
    if (!channel || !allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: channel ? 403 : 404 })
    }

    const body = await req.json()
    const parsed = channelMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        channelId: channel.id,
        authorId: ctx.userId,
        content: parsed.data.content,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
