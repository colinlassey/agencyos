import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission } from '@/server/rbac'
import { GooglePushButton } from '@/components/calendar/GooglePushButton'
import { addWeeks, isWithinInterval, startOfWeek } from 'date-fns'

export default async function CalendarPage() {
  const ctx = await requireAuth()
  assertPermission(ctx, 'project:read')

  const tasks = await prisma.task.findMany({
    where: {
      isDeleted: false,
      dueDate: { not: null },
      project: {
        isDeleted: false,
        ...(ctx.role === 'CLIENT'
          ? { client: { contacts: { some: { userId: ctx.userId } } } }
          : ctx.role === 'DEVELOPER'
          ? { memberships: { some: { userId: ctx.userId } } }
          : {}),
      },
    },
    include: {
      project: { select: { id: true, name: true, client: { select: { name: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  })

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const nextWeek = addWeeks(weekStart, 1)
  const upcomingWeek = tasks.filter((task) => task.dueDate && isWithinInterval(task.dueDate, { start: weekStart, end: nextWeek }))
  const featureFlag = process.env.GOOGLE_CALENDAR_PUSH === 'true'

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-sm text-slate-400">Due dates and milestones across all active work.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">This week</h2>
        <ul className="space-y-2 text-sm text-slate-200">
          {upcomingWeek.map((task) => (
            <li key={task.id} className="flex flex-col rounded border border-slate-800 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-100">{task.title}</p>
                  <p className="text-xs text-slate-400">
                    {task.project.client.name} • {task.project.name}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{task.dueDate?.toLocaleDateString()}</span>
              </div>
              <GooglePushButton
                projectId={task.project.id}
                dueDate={task.dueDate?.toISOString() ?? new Date().toISOString()}
                title={`${task.project.name}: ${task.title}`}
                enabled={featureFlag}
              />
            </li>
          ))}
          {upcomingWeek.length === 0 ? <li className="text-slate-500">No due dates this week.</li> : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">All upcoming</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded border border-slate-800 px-4 py-3 text-sm">
              <p className="font-medium text-slate-100">{task.title}</p>
              <p className="text-xs text-slate-400">{task.project.client.name} • {task.project.name}</p>
              <p className="text-xs text-slate-500">Due {task.dueDate?.toLocaleString()}</p>
            </div>
          ))}
          {tasks.length === 0 ? <p className="text-sm text-slate-500">No scheduled work.</p> : null}
        </div>
      </section>
    </div>
  )
}
