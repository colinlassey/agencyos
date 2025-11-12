import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission } from '@/server/rbac'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import { StatusPill } from '@/components/ui/StatusPill'
import { DueSoonBadge } from '@/components/ui/DueSoonBadge'
import { TaskStatus } from '@prisma/client'

const columns: TaskStatus[] = ['TODO', 'DOING', 'REVIEW', 'DONE', 'BLOCKED']

export default async function ProjectsPage() {
  const ctx = await requireAuth()
  assertPermission(ctx, 'project:read')

  const projects = await prisma.project.findMany({
    where: {
      isDeleted: false,
      ...(ctx.role === 'CLIENT'
        ? {
            client: {
              contacts: { some: { userId: ctx.userId } },
            },
          }
        : ctx.role === 'DEVELOPER'
        ? {
            memberships: { some: { userId: ctx.userId } },
          }
        : {}),
    },
    include: {
      client: { select: { name: true } },
      tasks: {
        where: { isDeleted: false },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { dueDate: 'asc' },
  })

  const tasks = projects.flatMap((project) => project.tasks.map((task) => ({ ...task, project })))

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Projects</h1>
          {ctx.role !== 'CLIENT' ? (
            <Link
              href="/projects/new"
              className="rounded bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              New project
            </Link>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {columns.map((status) => (
            <div key={status} className="flex flex-col rounded border border-slate-800 bg-slate-900/40">
              <header className="border-b border-slate-800 px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                {status}
              </header>
              <div className="flex flex-1 flex-col gap-3 p-3">
                {tasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <div key={task.id} className="rounded border border-slate-800 bg-slate-900/60 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{task.project.name}</span>
                        <StatusPill status={task.status} />
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-100">{task.title}</p>
                      <div className="mt-2 text-xs text-slate-400">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                        <DueSoonBadge dueDate={task.dueDate} status={task.status} />
                      </div>
                    </div>
                  ))}
                {tasks.filter((task) => task.status === status).length === 0 ? (
                  <p className="text-xs text-slate-500">No tasks</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Project list</h2>
        <div className="overflow-hidden rounded border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Client</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Due date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-2">
                    <Link href={`/projects/${project.id}`} className="text-sky-300 hover:text-sky-200">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-300">{project.client.name}</td>
                  <td className="px-4 py-2">
                    <PriorityBadge priority={project.priority} />
                  </td>
                  <td className="px-4 py-2 text-slate-300">
                    {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
