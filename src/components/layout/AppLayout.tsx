import Link from 'next/link'
import { ReactNode } from 'react'

const navItems = [
  { href: '/clients', label: 'Clients' },
  { href: '/projects', label: 'Projects' },
  { href: '/team', label: 'Team Heatmap' },
  { href: '/chat', label: 'Chat' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/files', label: 'Files' },
]

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-sky-500 focus:text-slate-950 focus:px-4 focus:py-2">Skip to content</a>
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold">AgencyOS</Link>
          <nav aria-label="Main navigation">
            <ul className="flex gap-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link className="text-sm font-medium hover:text-sky-400 focus-visible:text-sky-400" href={item.href}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
