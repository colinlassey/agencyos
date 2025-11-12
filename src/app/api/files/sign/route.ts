import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../server/auth'
import { assertPermission } from '../../../../server/rbac'
import { fileSignRequestSchema } from '../../../../server/validators'
import { createUploadUrl, publicFileUrl, resolveStorageKey } from '../../../../lib/files/s3'
import { handleRouteError } from '../../../../server/response'

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth()
    assertPermission(ctx, 'file:write')

    const body = await req.json()
    const parsed = fileSignRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data

    const latest = await prisma.file.findFirst({
      where: {
        name: payload.filename,
        clientId: payload.clientId ?? undefined,
        projectId: payload.projectId ?? undefined,
      },
      orderBy: { version: 'desc' },
    })

    const version = (latest?.version ?? 0) + 1
    const key = resolveStorageKey({
      clientId: payload.clientId,
      projectId: payload.projectId,
      filename: payload.filename,
      version,
    })

    const uploadUrl = await createUploadUrl(key, payload.mime)
    const url = publicFileUrl(key)

    const file = await prisma.file.create({
      data: {
        name: payload.filename,
        url,
        mime: payload.mime,
        size: payload.size,
        version,
        clientId: payload.clientId,
        projectId: payload.projectId,
        uploaderId: ctx.userId,
      },
    })

    return NextResponse.json({ uploadUrl, key, file })
  } catch (error) {
    return handleRouteError(error)
  }
}
