import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../server/auth'
import { assertPermission } from '../../../server/rbac'
import { handleRouteError } from '../../../server/response'

export async function GET() {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'notification:read')

    const notifications = await prisma.notification.findMany({
      where: { userId: ctx.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'notification:read')

    const body = await req.json().catch(() => ({}))
    const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids : undefined

    await prisma.notification.updateMany({
      where: {
        userId: ctx.userId,
        readAt: null,
        ...(ids ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
