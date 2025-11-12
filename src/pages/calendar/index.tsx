import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AppLayout } from '../../components/layout/AppLayout'

const fetchCalendar = async () => {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('Failed to load projects')
  const projects = (await res.json()).projects as Array<{
    id: string
    name: string
    dueDate: string
  }>

  return projects.map((project) => ({
    id: project.id,
    title: project.name,
    date: project.dueDate,
  }))
}

export default function CalendarPage() {
  const { data } = useQuery({ queryKey: ['calendar'], queryFn: fetchCalendar })

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="mt-2 text-sm text-slate-300">Project due dates and milestones. Connect Google Calendar to push events.</p>
        </div>
        <button className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Push to Google</button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {data?.map((event) => (
          <article key={event.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p className="mt-2 text-sm text-slate-300">Due {format(new Date(event.date), 'PPPP')}</p>
          </article>
        ))}
      </div>
    </AppLayout>
  )
}
