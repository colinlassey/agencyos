'use client'

import { useRef, useState, useTransition } from 'react'

type Props = {
  clientId?: string
  projectId?: string
  onUploaded?: () => void
}

export function FileUploader({ clientId, projectId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" className="block w-full text-sm text-slate-200" />
      <button
        type="button"
        className="rounded bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
          const file = inputRef.current?.files?.[0]
          if (!file) {
            setError('Select a file first')
            return
          }
          setError(null)
          startTransition(async () => {
            const signResponse = await fetch('/api/files/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId,
                projectId,
                filename: file.name,
                mime: file.type,
                size: file.size,
              }),
            })
            if (!signResponse.ok) {
              const body = await signResponse.json().catch(() => ({}))
              setError(body.error ?? 'Unable to prepare upload')
              return
            }
            const { uploadUrl } = await signResponse.json()
            const uploadResponse = await fetch(uploadUrl, {
              method: 'PUT',
              headers: { 'Content-Type': file.type },
              body: file,
            })
            if (!uploadResponse.ok) {
              setError('Upload failed')
              return
            }
            onUploaded?.()
          })
        }}
      >
        Upload file
      </button>
      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  )
}
