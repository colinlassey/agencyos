import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '../../components/layout/AppLayout'

const fetchProject = async (id: string) => {
  const res = await fetch(`/api/projects/${id}`)
  if (!res.ok) throw new Error('Failed to load project')
  return (await res.json()).project as {
    id: string
    name: string
    description: string | null
    stage: string
    priority: string
    dueDate: string
    tasks: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate: string
      reviewStatus: string
      estimateHours: number
      feedback: { id: string; content: string; visibleToClient: boolean }[]
    }>
    reviewRequests: Array<{ id: string; status: string; notes: string | null }>
    files: Array<{ id: string; filename: string; url: string }>
  }
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const projectId = router.query.projectId as string
  const { data } = useQuery({ queryKey: ['project', projectId], queryFn: () => fetchProject(projectId), enabled: Boolean(projectId) })

  if (!data) {
    return (
      <AppLayout>
        <p className="text-sm text-slate-300">Loading project…</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          <p className="mt-1 text-sm text-slate-300">{data.description ?? 'No description yet.'}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-slate-800 px-3 py-1">Stage: {data.stage}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1">Priority: {data.priority}</span>
          <span className="rounded-full bg-slate-800 px-3 py-1">Due {new Date(data.dueDate).toLocaleDateString()}</span>
        </div>
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <ul className="space-y-3">
            {data.tasks.map((task) => {
              const dueSoon = new Date(task.dueDate).getTime() - Date.now() < 72 * 3600 * 1000
              return (
                <li key={task.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                      <p className="text-xs text-slate-400">{task.status} · {task.priority}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      {dueSoon && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-200">Due soon</span>}
                      <span>{task.reviewStatus}</span>
                      <span>{task.estimateHours}h</span>
                    </div>
                  </div>
                  {task.feedback.length > 0 && (
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {task.feedback.map((feedback) => (
                        <li key={feedback.id}>
                          {feedback.content}
                          {!feedback.visibleToClient && <span className="ml-2 rounded bg-slate-800 px-1">Internal</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold">Reviews</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.reviewRequests.map((review) => (
                <li key={review.id} className="rounded-md border border-slate-800/60 p-3">
                  <p>Status: {review.status}</p>
                  {review.notes && <p className="mt-1 text-xs text-slate-400">{review.notes}</p>}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold">Files</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.files.map((file) => (
                <li key={file.id}>
                  <a href={file.url} className="text-sky-400" target="_blank" rel="noreferrer">
                    {file.filename}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </AppLayout>
  )
}
