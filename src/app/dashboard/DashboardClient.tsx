'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')
    setJoinSuccess('')
    setJoinLoading(true)

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.toUpperCase().trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        setJoinError(data.error || 'Error al unirse al grupo')
        return
      }

      setJoinSuccess(`¡Te has unido al grupo exitosamente!`)
      setJoinCode('')
      
      // Recargar después de 1 segundo para ver el nuevo grupo
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      setJoinError('Error al conectar con el servidor')
      console.error(error)
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[var(--foreground)]">Dashboard</h1>
      </div>

      {/* Botones crear grupo y unirse por código */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Link
          href="/dashboard/groups/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity font-semibold"
        >
          + Crear Grupo
        </Link>
      </div>

      {/* Sección Unirse por Código */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Unirse a un Grupo</h2>
        <form onSubmit={handleJoinGroup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ingresa el código del grupo"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            disabled={joinLoading}
          />
          <button
            type="submit"
            disabled={joinLoading || !joinCode.trim()}
            className="px-6 py-2.5 bg-[var(--secondary)] text-[var(--foreground)] rounded-lg hover:opacity-80 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joinLoading ? 'Uniéndose...' : 'Unirse'}
          </button>
        </form>
        
        {joinError && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{joinError}</p>
          </div>
        )}
        
        {joinSuccess && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{joinSuccess}</p>
          </div>
        )}
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
  )
}
