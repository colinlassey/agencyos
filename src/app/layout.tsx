import '@/styles/globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: 'AgencyOS',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950 text-slate-50">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
