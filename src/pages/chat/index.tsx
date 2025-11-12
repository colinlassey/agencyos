import { useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AppLayout } from '../../components/layout/AppLayout'

let socket: Socket | null = null

const fetchThreads = async () => {
  const res = await fetch('/api/chat/threads')
  if (!res.ok) throw new Error('Failed to load threads')
  return (await res.json()).threads as Array<{
    id: string
    name: string | null
    type: 'GENERAL' | 'PROJECT' | 'DIRECT'
    projectId?: string
    project?: { name: string }
  }>
}

const fetchMessages = async (threadId: string) => {
  const res = await fetch(`/api/chat/messages?threadId=${threadId}`)
  if (!res.ok) throw new Error('Failed to load messages')
  return (await res.json()).messages as Array<{
    id: string
    content: string
    author: { name: string | null }
    createdAt: string
  }>
}

export default function ChatPage() {
  const queryClient = useQueryClient()
  const { data: threads } = useQuery({ queryKey: ['threads'], queryFn: fetchThreads })
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const { data: messages } = useQuery({
    queryKey: ['messages', activeThreadId],
    queryFn: () => fetchMessages(activeThreadId ?? ''),
    enabled: Boolean(activeThreadId),
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!socket) {
      socket = io('/api/socket/io', { transports: ['websocket'] })
      socket.on('message:new', (payload: { threadId: string }) => {
        queryClient.invalidateQueries({ queryKey: ['messages', payload.threadId] })
      })
    }
    return () => {
      socket?.off('message:new')
    }
  }, [queryClient])

  useEffect(() => {
    if (!activeThreadId && threads?.length) {
      setActiveThreadId(threads[0].id)
    }
  }, [threads, activeThreadId])

  const activeThread = useMemo(() => threads?.find((thread) => thread.id === activeThreadId), [threads, activeThreadId])

  const handleSend = async () => {
    if (!message.trim() || !activeThreadId) return
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId: activeThreadId, content: message }),
    })
    setMessage('')
  }

  return (
    <AppLayout>
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/60">
          <h2 className="px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Threads</h2>
          <nav aria-label="Chat threads">
            <ul className="space-y-1 px-2 py-2">
              {threads?.map((thread) => (
                <li key={thread.id}>
                  <button
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      thread.id === activeThreadId ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    onClick={() => setActiveThreadId(thread.id)}
                  >
                    {thread.name ?? thread.project?.name ?? thread.type}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h1 className="text-lg font-semibold">{activeThread?.name ?? activeThread?.project?.name ?? 'Select a thread'}</h1>
              <p className="text-xs text-slate-400">General chat and DMs update in real time.</p>
            </div>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages?.map((msg) => (
              <article key={msg.id} className="rounded-md border border-slate-800/80 bg-slate-900 p-3 text-sm">
                <header className="flex items-center justify-between text-xs text-slate-400">
                  <span>{msg.author.name ?? 'Unknown'}</span>
                  <time dateTime={msg.createdAt}>{new Date(msg.createdAt).toLocaleTimeString()}</time>
                </header>
                <p className="mt-2 text-slate-200">{msg.content}</p>
              </article>
            ))}
          </div>
          <form
            className="flex gap-3 border-t border-slate-800 p-4"
            onSubmit={(event) => {
              event.preventDefault()
              void handleSend()
            }}
          >
            <label className="sr-only" htmlFor="message">Message</label>
            <input
              id="message"
              className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm"
              placeholder="Type a message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button type="submit" className="rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950">
              Send
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
