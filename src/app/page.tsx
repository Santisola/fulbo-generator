'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="text-center px-4 max-w-4xl">
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-[var(--primary)]/10 rounded-full mb-8 border-2 border-[var(--primary)]/20">
            <svg className="w-16 h-16 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            Fulbo Teams
          </h1>
          <p className="text-xl text-[var(--muted-foreground)] max-w-lg mx-auto leading-relaxed">
            Generá equipos de fútbol 5 equilibrados y justos para tus partidos amateur
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/login"
            className="px-8 py-4 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-[var(--primary)]/25"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="px-8 py-4 bg-[var(--card)] text-[var(--foreground)] font-semibold rounded-xl hover:opacity-80 transition-all border border-[var(--border)]"
          >
            Crear Cuenta
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-[var(--foreground)] font-semibold mb-1">Grupos</h3>
            <p className="text-[var(--muted-foreground)] text-sm">Creá grupos con amigos</p>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-[var(--foreground)] font-semibold mb-1">Puntuar</h3>
            <p className="text-[var(--muted-foreground)] text-sm">Puntúa a los jugadores</p>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-[var(--foreground)] font-semibold mb-1">Equipos</h3>
            <p className="text-[var(--muted-foreground)] text-sm">Equipos equilibrados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
