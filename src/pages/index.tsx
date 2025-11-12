import Link from 'next/link'
import { AppLayout } from '../components/layout/AppLayout'

export default function Home() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow">
          <h2 className="text-xl font-semibold">Getting Started</h2>
          <p className="mt-2 text-sm text-slate-300">
            Use the navigation to manage clients, projects, tasks, and collaborate with your team.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/clients" className="text-sky-400">View Clients</Link></li>
            <li><Link href="/projects" className="text-sky-400">Plan Projects</Link></li>
            <li><Link href="/chat" className="text-sky-400">Open Chat</Link></li>
          </ul>
        </section>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 shadow">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="mt-2 text-sm text-slate-300">
            Stay informed about assignments, reviews, and updates in real time.
          </p>
        </section>
      </div>
    </AppLayout>
  )
}
