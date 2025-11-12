'use client'

import { differenceInHours } from 'date-fns'
import type { TaskStatus } from '@prisma/client'

export function DueSoonBadge({ dueDate, status }: { dueDate: string | Date | null | undefined; status: TaskStatus }) {
  if (!dueDate) return null
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  if (status === 'DONE') return null
  const hours = differenceInHours(date, new Date())
  if (hours > 72) return null
  const severity = hours < 0 ? 'overdue' : 'due soon'

  return (
    <span className="ml-2 inline-flex items-center rounded bg-rose-500/20 px-2 py-0.5 text-xs font-medium text-rose-200">
      {severity === 'overdue' ? 'Overdue' : 'Due soon'}
    </span>
  )
}
