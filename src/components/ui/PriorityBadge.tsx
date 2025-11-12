'use client'

import clsx from 'clsx'
import type { PriorityLevel } from '@prisma/client'

const priorityStyles: Record<PriorityLevel, string> = {
  LOW: 'border border-slate-600 text-slate-200',
  MEDIUM: 'border border-emerald-500/50 text-emerald-300',
  HIGH: 'border border-amber-500/50 text-amber-300',
  CRITICAL: 'border border-rose-500/50 text-rose-300 animate-pulse',
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return (
    <span className={clsx('inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase', priorityStyles[priority])}>
      {priority}
    </span>
  )
}
