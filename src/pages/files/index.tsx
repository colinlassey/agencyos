import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '../../components/layout/AppLayout'

const fetchFiles = async (scope: { clientId?: string; projectId?: string }) => {
  const params = new URLSearchParams()
  if (scope.clientId) params.set('clientId', scope.clientId)
  if (scope.projectId) params.set('projectId', scope.projectId)
  const res = await fetch(`/api/files?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to load files')
  return (await res.json()).files as Array<{
    id: string
    filename: string
    url: string
    createdAt: string
  }>
}

export default function FileExplorerPage() {
  const [scope, setScope] = useState<{ clientId?: string; projectId?: string }>({})
  const { data } = useQuery({ queryKey: ['files', scope], queryFn: () => fetchFiles(scope) })

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Files</h1>
          <p className="mt-2 text-sm text-slate-300">Upload and browse files scoped to clients or projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">Upload</button>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="w-64 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Filters</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <button
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-left"
              onClick={() => setScope({})}
            >
              All files
            </button>
            <button
              className="w-full rounded-md bg-slate-800 px-3 py-2 text-left"
              onClick={() => setScope({ clientId: 'client-1' })}
            >
              Example Client
            </button>
          </div>
        </div>
        <div className="flex-1 rounded-lg border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/70">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Filename</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data?.map((file) => (
                <tr key={file.id}>
                  <td className="px-4 py-3 text-sm text-slate-200">
                    <a href={file.url} className="text-sky-400" target="_blank" rel="noreferrer">
                      {file.filename}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{new Date(file.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
