import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission } from '../../../server/rbac'
import { createTimeLogSchema, timeLogQuerySchema } from '../../../server/validators'
import { TimeLogTargetType } from '@prisma/client'
import { startOfWeek } from 'date-fns'
import { handleRouteError } from '../../../server/response'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'timelog:write')

    const body = await req.json()
    const parsed = createTimeLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const date = payload.date

    let projectId = payload.projectId
    let taskId = payload.taskId

    if (payload.targetType === TimeLogTargetType.TASK) {
      const task = await prisma.task.findUnique({ where: { id: payload.targetId } })
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      projectId = task.projectId
      taskId = payload.targetId
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 })
    }

    const log = await prisma.timeLog.create({
      data: {
        targetType: payload.targetType,
        targetId: payload.targetId,
        projectId,
        taskId,
        memberId: ctx.userId,
        hours: payload.hours,
        date,
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'timelog:read')

    const query = timeLogQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()))
    if (!query.success) {
      return NextResponse.json({ error: query.error.flatten() }, { status: 400 })
    }

    const filters = query.data

    const logs = await prisma.timeLog.findMany({
      where: {
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.userId ? { memberId: filters.userId } : {}),
        ...(filters.start || filters.end
          ? {
              date: {
                gte: filters.start,
                lte: filters.end,
              },
            }
          : {}),
      },
      include: {
        member: { select: { id: true, name: true, email: true, capacityHrsPerWeek: true } },
      },
      orderBy: { date: 'desc' },
    })

    const rollup = new Map<string, { memberId: string; weekStart: string; hours: number; capacity?: number; memberName?: string }>()

    for (const log of logs) {
      const week = startOfWeek(log.date, { weekStartsOn: 1 }).toISOString()
      const key = `${log.memberId}-${week}`
      if (!rollup.has(key)) {
        rollup.set(key, {
          memberId: log.memberId,
          weekStart: week,
          hours: 0,
          capacity: log.member.capacityHrsPerWeek ?? undefined,
          memberName: log.member.name ?? log.member.email ?? 'Unknown',
        })
      }
      const bucket = rollup.get(key)!
      bucket.hours += log.hours
    }

    return NextResponse.json({
      logs,
      weekly: Array.from(rollup.values()),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
