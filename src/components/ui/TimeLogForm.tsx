'use client'

import { useState, useTransition } from 'react'

interface Props {
  targetType: 'PROJECT' | 'TASK'
  targetId: string
  projectId?: string
  onLogged?: () => void
}

export function TimeLogForm({ targetType, targetId, projectId, onLogged }: Props) {
  const [hours, setHours] = useState('1')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
          const response = await fetch('/api/timelogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetType,
              targetId,
              projectId,
              hours: Number(hours),
              date,
            }),
          })
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            setError(body.error ?? 'Unable to log time')
            return
          }
          onLogged?.()
        })
      }}
    >
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-slate-400">
          Hours
          <input
            type="number"
            step="0.25"
            min="0.25"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className="mt-1 w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wide text-slate-400">
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
      >
        Log time
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </form>
  )
}
