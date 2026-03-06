'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-[var(--primary)]">
                Fulbo Teams
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-[var(--foreground)] hover:text-[var(--primary)] transition-colors">
                  Mis Grupos
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="h-6 w-px bg-[var(--border)]"></div>
              <span className="text-[var(--foreground)] hidden sm:block">{session.user?.name || session.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
