import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '../../components/layout/AppLayout'
import { useState } from 'react'

const fetchClients = async () => {
  const res = await fetch('/api/clients')
  if (!res.ok) throw new Error('Failed to load clients')
  return (await res.json()).clients as Array<{
    id: string
    name: string
    stage: string
    priority: string
    dueDate: string | null
    projects: { id: string; name: string; dueDate: string }[]
  }>
}

export default function ClientsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['clients'], queryFn: fetchClients })
  const [filter, setFilter] = useState('')

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="client-filter">Filter clients</label>
          <input
            id="client-filter"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Filter by name"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <button className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 shadow focus-visible:outline-none">
            New Client
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/70">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Client</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Stage</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Priority</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Due</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Projects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">Loading clients…</td>
              </tr>
            )}
            {data
              ?.filter((client) => client.name.toLowerCase().includes(filter.toLowerCase()))
              .map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-100">{client.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{client.stage}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{client.priority}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{client.dueDate ? new Date(client.dueDate).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <ul className="list-inside list-disc space-y-1">
                      {client.projects.map((project) => (
                        <li key={project.id}>{project.name}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
