import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '../../components/layout/AppLayout'

const fetchProjects = async () => {
  const res = await fetch('/api/projects')
  if (!res.ok) throw new Error('Failed to load projects')
  return (await res.json()).projects as Array<{
    id: string
    name: string
    stage: string
    priority: string
    dueDate: string
    tasks: { id: string; status: string; priority: string; dueDate: string }[]
    client: { id: string; name: string }
  }>
}

const columns = ['DISCOVERY', 'DESIGN', 'BUILD', 'QA', 'LAUNCH', 'MAINTENANCE'] as const

export default function ProjectsPage() {
  const { data } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const [view, setView] = useState<'board' | 'table'>('board')

  const board = useMemo(() => {
    const map = Object.fromEntries(columns.map((col) => [col, [] as typeof data]))
    data?.forEach((project) => {
      map[project.stage]?.push(project)
    })
    return map
  }, [data])

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div role="radiogroup" aria-label="Project view" className="flex gap-2">
          <button
            role="radio"
            aria-checked={view === 'board'}
            className={`rounded-md px-3 py-2 text-sm font-medium ${view === 'board' ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
            onClick={() => setView('board')}
          >
            Board
          </button>
          <button
            role="radio"
            aria-checked={view === 'table'}
            className={`rounded-md px-3 py-2 text-sm font-medium ${view === 'table' ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {columns.map((column) => (
            <section key={column} className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <header className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-400">
                {column}
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{board[column]?.length ?? 0}</span>
              </header>
              <div className="space-y-3">
                {board[column]?.map((project) => (
                  <article key={project.id} className="rounded-md border border-slate-800 bg-slate-900 p-3 shadow">
                    <div className="flex items-center justify-between">
                      <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-slate-100 hover:text-sky-400">
                        {project.name}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${project.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
                        {project.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Due {new Date(project.dueDate).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs text-slate-400">{project.client.name}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Stage</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Due</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data?.map((project) => (
                <tr key={project.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-100">
                    <Link href={`/projects/${project.id}`} className="hover:text-sky-400">{project.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{project.client.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{project.stage}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{project.priority}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{new Date(project.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{project.tasks.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
