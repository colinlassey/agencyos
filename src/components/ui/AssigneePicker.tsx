'use client'

import { useMemo } from 'react'

type Option = { id: string; name: string }

type Props = {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
}

export function AssigneePicker({ options, value, onChange }: Props) {
  const selected = useMemo(() => new Set(value), [value])

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assignees</legend>
      {options.map((option) => {
        const isChecked = selected.has(option.id)
        return (
          <label key={option.id} className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-400"
              checked={isChecked}
              onChange={(event) => {
                const next = new Set(selected)
                if (event.target.checked) {
                  next.add(option.id)
                } else {
                  next.delete(option.id)
                }
                onChange(Array.from(next))
              }}
            />
            <span>{option.name}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
