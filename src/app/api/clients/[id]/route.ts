import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../server/auth'
import { assertPermission, canAccessClient } from '../../../../server/rbac'
import { updateClientSchema } from '../../../../server/validators'
import { handleRouteError } from '../../../../server/response'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()

    const client = await prisma.client.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        contacts: { select: { userId: true } },
        projects: {
          where: { isDeleted: false },
          include: {
            tasks: {
              where: { isDeleted: false },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
            files: {
              where: { isDeleted: false },
              select: {
                id: true,
                name: true,
                version: true,
                createdAt: true,
              },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!canAccessClient(ctx, client.contacts.map((c) => c.userId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'client:write')

    const body = await req.json()
    const parsed = updateClientSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const updateData: any = { ...data }
    if (data.name) {
      updateData.name = data.name.trim()
      updateData.nameNormalized = data.name.trim().toLowerCase()
    }
    if (data.domain) {
      updateData.domain = data.domain.toLowerCase()
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ client })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'client:write')

    await prisma.client.update({
      where: { id: params.id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
