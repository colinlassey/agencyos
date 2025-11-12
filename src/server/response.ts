import { NextResponse } from 'next/server'

export function handleRouteError(error: unknown) {
  const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500
  const message = error instanceof Error ? error.message : 'Unexpected error'
  return NextResponse.json({ error: message }, { status })
}
