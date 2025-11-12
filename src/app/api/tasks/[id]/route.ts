import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../server/auth'
import { assertPermission, canAccessTask } from '../../../../server/rbac'
import { updateTaskSchema } from '../../../../server/validators'
import type { TaskStatus } from '@prisma/client'
import { handleRouteError } from '../../../../server/response'

const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  TODO: ['DOING'],
  DOING: ['REVIEW'],
  REVIEW: ['DONE', 'BLOCKED'],
  DONE: [],
  BLOCKED: ['DOING'],
}

function isValidTransition(current: TaskStatus, next: TaskStatus) {
  if (current === next) return true
  return allowedTransitions[current]?.includes(next) ?? false
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()

    const task = await prisma.task.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        project: {
          include: {
            memberships: { select: { userId: true } },
            client: { select: { contacts: { select: { userId: true } } } },
          },
        },
        feedback: true,
        reviewItems: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const projectMembers = task.project.memberships.map((m) => m.userId)
    const clientContacts = task.project.client.contacts.map((c) => c.userId)

    if (!canAccessTask(ctx, task.assigneeIds, projectMembers, clientContacts)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'task:write')

    const existing = await prisma.task.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    if (data.status && !isValidTransition(existing.status, data.status as TaskStatus)) {
      return NextResponse.json({ error: `Invalid transition from ${existing.status} to ${data.status}` }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...data,
        assigneeIds: data.assigneeIds ?? existing.assigneeIds,
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'task:write')

    await prisma.task.update({
      where: { id: params.id },
      data: { isDeleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
