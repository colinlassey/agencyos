import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/server/auth'
import { assertPermission } from '@/server/rbac'
import { ChatComposer } from '@/components/chat/ChatComposer'

export default async function ChatPage() {
  const ctx = await requireAuth()
  assertPermission(ctx, 'chat:read')

  const channels = await prisma.channel.findMany({
    where: {
      isArchived: false,
      OR: [
        { type: 'GENERAL' },
        { participants: { some: { userId: ctx.userId } } },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 25,
        include: {
          author: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const activeChannel = channels[0]

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr_220px]">
      <aside className="space-y-2 rounded border border-slate-800 p-4">
        <h2 className="text-sm font-semibold uppercase text-slate-400">Channels</h2>
        <ul className="space-y-1 text-sm text-slate-200">
          {channels.map((channel) => (
            <li key={channel.id} className={channel.id === activeChannel?.id ? 'font-semibold text-sky-300' : ''}>
              {channel.name ?? channel.type}
            </li>
          ))}
          {channels.length === 0 ? <li className="text-slate-500">No channels</li> : null}
        </ul>
      </aside>

      <section className="flex h-full flex-col rounded border border-slate-800">
        <header className="border-b border-slate-800 px-4 py-3">
          <h1 className="text-lg font-semibold">{activeChannel?.name ?? activeChannel?.type ?? 'Chat'}</h1>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
          {activeChannel?.messages.map((message) => (
            <article key={message.id} className="rounded border border-slate-800 bg-slate-900/60 px-3 py-2">
              <header className="flex items-center justify-between text-xs text-slate-400">
                <span>{message.author.name ?? message.author.email ?? 'Unknown'}</span>
                <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
              </header>
              <p className="mt-1 text-slate-100">{message.content}</p>
            </article>
          ))}
          {activeChannel?.messages.length === 0 ? <p className="text-slate-500">No messages yet.</p> : null}
        </div>
        {activeChannel ? (
          <div className="border-t border-slate-800 px-4 py-3">
            <ChatComposer channelId={activeChannel.id} />
          </div>
        ) : null}
      </section>

      <aside className="space-y-3 rounded border border-slate-800 p-4 text-sm text-slate-300">
        <h2 className="text-sm font-semibold uppercase text-slate-400">Context</h2>
        <p>Link tasks and project threads directly from the message composer to keep feedback actionable.</p>
      </aside>
    </div>
  )
}
