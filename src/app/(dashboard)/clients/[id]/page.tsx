import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission, canAccessClient } from '@/server/rbac'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { FileUploader } from '@/components/ui/FileUploader'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  assertPermission(ctx, 'client:read')

  const client = await prisma.client.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      contacts: { select: { userId: true } },
      projects: {
        where: { isDeleted: false },
        include: {
          tasks: {
            where: { isDeleted: false },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
      files: {
        where: { isDeleted: false },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!client) {
    notFound()
  }

  if (!canAccessClient(ctx, client.contacts.map((c) => c.userId))) {
    throw new Error('Forbidden')
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-slate-400">{client.notes ?? 'No notes yet.'}</p>
        </div>
        <PriorityBadge priority={client.priority} />
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          {ctx.role !== 'CLIENT' ? (
            <Link
              href={`/projects/new?clientId=${client.id}`}
              className="rounded bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              New project
            </Link>
          ) : null}
        </div>
        <div className="space-y-2">
          {client.projects.map((project) => (
            <div key={project.id} className="rounded border border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <Link href={`/projects/${project.id}`} className="text-base font-medium text-sky-300">
                  {project.name}
                </Link>
                <span className="text-xs uppercase text-slate-400">{project.stage}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {project.tasks.length} tasks active
              </p>
            </div>
          ))}
          {client.projects.length === 0 ? <p className="text-sm text-slate-400">No projects yet.</p> : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Files</h2>
        </div>
        <FileUploader clientId={client.id} />
        <ul className="space-y-2 text-sm text-slate-200">
          {client.files.map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2">
              <a href={file.url} className="text-sky-300 hover:text-sky-200" target="_blank" rel="noreferrer">
                {file.name} v{file.version}
              </a>
              <span className="text-xs text-slate-500">{new Date(file.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
          {client.files.length === 0 ? <li className="text-sm text-slate-400">No files uploaded.</li> : null}
        </ul>
      </section>
    </div>
  )
}
