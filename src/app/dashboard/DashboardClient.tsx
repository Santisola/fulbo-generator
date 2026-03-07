'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppGuide } from '@/components/AppGuide'
import { HelpTooltip } from '@/components/HelpTooltip'

interface Group {
  id: string
  name: string
  code: string
  createdAt: Date
  members?: Array<{ id: string; userId: string }>
  players?: Array<{ id: string; name: string }>
}

interface DashboardClientProps {
  groups: Group[]
}

export default function DashboardClient({ groups }: DashboardClientProps) {
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <>
      <AppGuide isOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      
      <div className="space-y-8">
        {/* Header con botón de ayuda */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-[var(--foreground)]">Dashboard</h1>
            <HelpTooltip
              title="¿Necesitas ayuda?"
              content="Haz clic en 'Ver Guía' para un tutorial completo sobre cómo usar la app"
              position="bottom"
            />
          </div>
          <button
            onClick={() => setGuideOpen(true)}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
          >
            Ver Guía
          </button>
        </div>

        {/* Botón crear grupo */}
        <div>
          <Link
            href="/dashboard/groups/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity font-semibold"
          >
            + Crear Grupo
          </Link>
        </div>

        {/* Lista de grupos */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">Mis Grupos</h2>
          {groups.length === 0 ? (
            <div className="bg-[var(--secondary)] rounded-lg p-8 text-center text-[var(--muted-foreground)]">
              <p className="mb-4">No tienes grupos aún.</p>
              <Link
                href="/dashboard/groups/new"
                className="text-[var(--primary)] hover:underline font-semibold"
              >
                Crea tu primer grupo
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
                  <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 hover:border-[var(--primary)]/50 transition-colors cursor-pointer h-full">
                    <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                      {group.name}
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-4">
                      Código: <span className="font-mono font-bold">{group.code}</span>
                    </p>
                    <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                      <p>👥 {group.members?.length || 0} miembros</p>
                      <p>⚽ {group.players?.length || 0} jugadores</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
