import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission, canAccessProject } from '@/server/rbac'
import { StatusPill } from '@/components/ui/StatusPill'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { DueSoonBadge } from '@/components/ui/DueSoonBadge'
import { TimeLogForm } from '@/components/ui/TimeLogForm'
import { FileUploader } from '@/components/ui/FileUploader'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  assertPermission(ctx, 'project:read')

  const project = await prisma.project.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      client: {
        include: {
          contacts: { select: { userId: true } },
        },
      },
      memberships: { select: { userId: true } },
      tasks: {
        where: { isDeleted: false },
        orderBy: { orderIndex: 'asc' },
      },
      files: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
      },
      reviewItems: {
        orderBy: { createdAt: 'desc' },
      },
      timeLogs: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      feedback: {
        where: { isClientVisible: ctx.role === 'CLIENT' ? true : undefined },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) {
    notFound()
  }

  if (!canAccessProject(ctx, project.memberships.map((m) => m.userId), project.client.contacts.map((c) => c.userId))) {
    throw new Error('Forbidden')
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-slate-400">Client: {project.client.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <PriorityBadge priority={project.priority} />
          <span className="text-sm text-slate-400">
            {project.dueDate ? `Due ${new Date(project.dueDate).toLocaleDateString()}` : 'No due date'}
          </span>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <div className="space-y-2">
          {project.tasks.map((task) => (
            <div key={task.id} className="rounded border border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-slate-100">{task.title}</h3>
                  <p className="text-sm text-slate-400">{task.description ?? 'No description provided.'}</p>
                </div>
                <StatusPill status={task.status} />
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                <DueSoonBadge dueDate={task.dueDate} status={task.status} />
              </div>
            </div>
          ))}
          {project.tasks.length === 0 ? <p className="text-sm text-slate-400">No tasks yet.</p> : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Scope &amp; Links</h2>
        <p className="text-sm text-slate-300">
          Capture scope docs or sprint links in the description field. Future iterations will add structured scope management.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Feedback</h2>
        <ul className="space-y-2">
          {project.feedback.map((item) => (
            <li key={item.id} className="rounded border border-slate-800 p-3 text-sm text-slate-200">
              {item.content}
              <span className="ml-2 text-xs uppercase text-slate-500">
                {item.isClientVisible ? 'Client visible' : 'Internal'}
              </span>
            </li>
          ))}
          {project.feedback.length === 0 ? <li className="text-sm text-slate-400">No feedback submitted.</li> : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <ul className="space-y-2 text-sm text-slate-200">
          {project.reviewItems.map((review) => (
            <li key={review.id} className="rounded border border-slate-800 p-3">
              <div className="flex items-center justify-between">
                <span>Status: {review.status}</span>
                <span className="text-xs text-slate-500">Created {new Date(review.createdAt).toLocaleString()}</span>
              </div>
              {review.notes ? <p className="mt-2 text-slate-300">{review.notes}</p> : null}
            </li>
          ))}
          {project.reviewItems.length === 0 ? <li className="text-sm text-slate-400">No review submissions yet.</li> : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Files</h2>
        <FileUploader clientId={project.clientId} projectId={project.id} />
        <ul className="space-y-2 text-sm text-slate-200">
          {project.files.map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2">
              <a href={file.url} className="text-sky-300 hover:text-sky-200" target="_blank" rel="noreferrer">
                {file.name} v{file.version}
              </a>
              <span className="text-xs text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
          {project.files.length === 0 ? <li className="text-sm text-slate-400">No files uploaded.</li> : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Time logs</h2>
        <TimeLogForm targetType="PROJECT" targetId={project.id} projectId={project.id} />
        <ul className="space-y-2 text-sm text-slate-200">
          {project.timeLogs.map((log) => (
            <li key={log.id} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2">
              <span>{log.hours}h on {new Date(log.date).toLocaleDateString()}</span>
              <span className="text-xs text-slate-500">Logged {new Date(log.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
          {project.timeLogs.length === 0 ? <li className="text-sm text-slate-400">No time logged yet.</li> : null}
        </ul>
      </section>
    </div>
  )
}
