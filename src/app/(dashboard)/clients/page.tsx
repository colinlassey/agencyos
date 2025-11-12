import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission } from '@/server/rbac'
import { PriorityBadge } from '@/components/ui/PriorityBadge'

export default async function ClientsPage() {
  const ctx = await requireAuth()
  assertPermission(ctx, 'client:read')

  const clients = await prisma.client.findMany({
    where: {
      isDeleted: false,
      ...(ctx.role === 'CLIENT'
        ? {
            contacts: {
              some: { userId: ctx.userId },
            },
          }
        : {}),
    },
    include: {
      projects: {
        where: { isDeleted: false },
        select: { id: true, name: true, stage: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-400">Track active engagements and access shared files.</p>
        </div>
        {ctx.role !== 'CLIENT' ? (
          <Link
            href="/clients/new"
            className="rounded bg-sky-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-sky-400"
          >
            Add client
          </Link>
        ) : null}
      </header>
      <div className="overflow-hidden rounded border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Projects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-900/40">
                <td className="px-4 py-3">
                  <Link href={`/clients/${client.id}`} className="font-medium text-sky-300 hover:text-sky-200">
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={client.priority} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {client.projects.length > 0 ? client.projects.map((p) => p.name).join(', ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
