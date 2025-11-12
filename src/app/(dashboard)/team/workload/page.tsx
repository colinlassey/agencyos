import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission } from '@/server/rbac'
import { startOfWeek } from 'date-fns'

export default async function WorkloadPage() {
  const ctx = await requireAuth()
  assertPermission(ctx, 'project:read')

  const users = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'DEVELOPER'] } },
    select: { id: true, name: true, email: true, capacityHrsPerWeek: true },
    orderBy: { name: 'asc' },
  })

  const tasks = await prisma.task.findMany({
    where: { isDeleted: false, status: { in: ['TODO', 'DOING', 'REVIEW'] } },
    select: { id: true, title: true, estimateHrs: true, assigneeIds: true },
  })

  const workload = new Map<string, number>()
  for (const task of tasks) {
    const estimate = task.estimateHrs ?? 0
    if (estimate <= 0) continue
    for (const assignee of task.assigneeIds) {
      workload.set(assignee, (workload.get(assignee) ?? 0) + estimate)
    }
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toLocaleDateString()

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Team workload</h1>
        <p className="text-sm text-slate-400">Assignments for the week of {weekStart}. Values over capacity are highlighted.</p>
      </header>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2 text-left">Member</th>
              <th className="px-4 py-2 text-left">Capacity (hrs)</th>
              <th className="px-4 py-2 text-left">Assigned (hrs)</th>
              <th className="px-4 py-2 text-left">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user) => {
              const capacity = user.capacityHrsPerWeek ?? 40
              const assigned = workload.get(user.id) ?? 0
              const utilization = Math.round((assigned / capacity) * 100)
              const isOverloaded = utilization > 100
              return (
                <tr key={user.id} className={isOverloaded ? 'bg-rose-500/10' : ''}>
                  <td className="px-4 py-2 text-slate-200">{user.name ?? user.email}</td>
                  <td className="px-4 py-2">{capacity}</td>
                  <td className="px-4 py-2">{assigned.toFixed(1)}</td>
                  <td className="px-4 py-2">{isFinite(utilization) ? `${utilization}%` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
