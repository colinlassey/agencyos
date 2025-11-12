'use client'

import { useState, useTransition } from 'react'

type Props = {
  projectId: string
  dueDate: string
  title: string
  enabled: boolean
}

export function GooglePushButton({ projectId, dueDate, title, enabled }: Props) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  if (!enabled) {
    return <span className="text-xs text-slate-500">Google Calendar push disabled.</span>
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={isPending}
        className="rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        onClick={() => {
          startTransition(async () => {
            const response = await fetch('/api/calendar/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projectId, dueDate, title }),
            })
            const body = await response.json().catch(() => ({}))
            if (!response.ok) {
              setMessage(body.error ?? 'Unable to push event')
              return
            }
            setMessage('Synced to Google Calendar')
          })
        }}
      >
        Push to Google Calendar
      </button>
      {message ? <p className="text-xs text-slate-400">{message}</p> : null}
    </div>
  )
}
