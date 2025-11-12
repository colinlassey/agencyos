import { useQuery } from '@tanstack/react-query'
import { addWeeks, format } from 'date-fns'
import { AppLayout } from '../../components/layout/AppLayout'

const fetchWorkload = async () => {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('Failed to load projects')
  const projects = (await res.json()).projects as Array<{
    id: string
    name: string
    tasks: { id: string; estimateHours: number; assignments: { user: { id: string; name: string } }[] }[]
  }>

  const workload: Record<string, { name: string; weeklyHours: Record<string, number> }> = {}
  const start = addWeeks(new Date(), -1)
  const weeks = Array.from({ length: 4 }, (_, idx) => format(addWeeks(start, idx), 'yyyy-MM-dd'))

  projects.forEach((project) => {
    project.tasks.forEach((task) => {
      const week = weeks[0]
      task.assignments.forEach((assignment) => {
        workload[assignment.user.id] ??= { name: assignment.user.name ?? 'Unknown', weeklyHours: {} }
        workload[assignment.user.id].weeklyHours[week] =
          (workload[assignment.user.id].weeklyHours[week] ?? 0) + task.estimateHours
      })
    })
  })

  return { workload, weeks }
}

export default function TeamHeatmapPage() {
  const { data } = useQuery({ queryKey: ['workload'], queryFn: fetchWorkload })

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold">Team Workload</h1>
      <p className="mt-2 text-sm text-slate-300">Compare capacity (40h/wk) against assigned hours.</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/70">
            <tr>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-400">Team Member</th>
              {data?.weeks.map((week) => (
                <th key={week} className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-slate-400">
                  Week of {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {Object.entries(data?.workload ?? {}).map(([userId, entry]) => (
              <tr key={userId}>
                <td className="px-4 py-3 font-medium text-slate-100">{entry.name}</td>
                {data?.weeks.map((week) => {
                  const hours = entry.weeklyHours[week] ?? 0
                  const overAllocated = hours > 40
                  return (
                    <td key={week} className="px-4 py-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          overAllocated ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'
                        }`}
                      >
                        {hours}h
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
