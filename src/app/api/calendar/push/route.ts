import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../server/auth'
import { assertPermission } from '../../../../server/rbac'
import { calendarPushSchema } from '../../../../server/validators'
import { pushToGoogleCalendar } from '../../../../lib/calendar/google'
import { prisma } from '../../../../lib/prisma'
import { handleRouteError } from '../../../../server/response'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'calendar:write')

    const body = await req.json()
    const parsed = calendarPushSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    const project = await prisma.project.findUnique({ where: { id: payload.projectId, isDeleted: false } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const result = await pushToGoogleCalendar({
      projectId: payload.projectId,
      dueDate: payload.dueDate,
      title: payload.title,
    })

    return NextResponse.json({ result })
  } catch (error) {
    return handleRouteError(error)
  }
}
