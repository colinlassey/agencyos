import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../server/auth'
import { assertPermission, canAccessProject } from '../../../../server/rbac'
import { updateProjectSchema } from '../../../../server/validators'
import { handleRouteError } from '../../../../server/response'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()

    const project = await prisma.project.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        client: {
          include: {
            contacts: { select: { userId: true } },
          },
        },
        memberships: { select: { userId: true } },
        tasks: {
          where: { isDeleted: false },
          orderBy: { orderIndex: 'asc' },
        },
        files: {
          where: { isDeleted: false },
        },
        reviewItems: true,
        timeLogs: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const projectMembers = project.memberships.map((m) => m.userId)
    const clientContacts = project.client.contacts.map((c) => c.userId)

    if (!canAccessProject(ctx, projectMembers, clientContacts)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'project:write')

    const body = await req.json()
    const parsed = updateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json({ project })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'project:write')

    await prisma.project.update({
      where: { id: params.id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
