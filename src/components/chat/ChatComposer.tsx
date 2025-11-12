'use client'

import { useState, useTransition } from 'react'

type Props = {
  channelId: string
  onSent?: () => void
}

export function ChatComposer({ channelId, onSent }: Props) {
  const [value, setValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!value.trim()) return
        startTransition(async () => {
          setError(null)
          const response = await fetch(`/api/channels/${channelId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: value.trim() }),
          })
          if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            setError(body.error ?? 'Unable to send message')
            return
          }
          setValue('')
          onSent?.()
        })
      }}
    >
      <textarea
        className="w-full rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
        rows={3}
        placeholder="Share an update..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="flex items-center justify-between">
        {error ? <p className="text-xs text-rose-400">{error}</p> : <span />}
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </form>
  )
}
