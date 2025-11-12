'use client'

import clsx from 'clsx'
import type { TaskStatus } from '@prisma/client'

const statusStyles: Record<TaskStatus, string> = {
  TODO: 'bg-slate-800 text-slate-100 border border-slate-600',
  DOING: 'bg-sky-500/20 text-sky-300 border border-sky-400/50',
  REVIEW: 'bg-amber-500/20 text-amber-300 border border-amber-400/50',
  DONE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50',
  BLOCKED: 'bg-rose-500/20 text-rose-300 border border-rose-400/50',
}

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusStyles[status])}>
      {status}
    </span>
  )
}
