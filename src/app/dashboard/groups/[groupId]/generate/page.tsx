'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface Player {
  id: string
  name: string
  averageRating: number | null
}

export default function GenerateTeamsPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = use(params)
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    teamA: Player[]
    teamB: Player[]
    averageDiff: number
  } | null>(null)

  useEffect(() => {
    async function fetchPlayers() {
      const res = await fetch(`/api/groups/${groupId}/players`)
      if (res.ok) {
        const data = await res.json()
        setPlayers(data)
      }
    }
    fetchPlayers()
  }, [groupId])

  const togglePlayer = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selected.length === players.length) {
      setSelected([])
    } else {
      setSelected(players.map(p => p.id))
    }
  }

  const handleGenerate = async () => {
    if (selected.length < 4) {
      setError('Seleccioná al menos 4 jugadores')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/groups/${groupId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: selected })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al generar equipos')
        setLoading(false)
        return
      }

      setResult(data)
    } catch {
      setError('Error de conexión')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">Generar Equipos</h1>
        <p className="text-[var(--muted-foreground)] mb-8">
          Seleccioná los jugadores que van a jugar hoy
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {result ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-center">
              <span className="text-[var(--primary)] font-semibold">Diferencia promedio: </span>
              <strong className="text-[var(--foreground)]">{result.averageDiff.toFixed(2)}</strong>
              <span className="text-[var(--primary)]"> puntos</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                    A
                  </span>
                  Equipo A
                </h2>
                <ul className="space-y-2">
                  {result.teamA.map((player, i) => (
                    <li key={player.id} className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
                      <span className="text-[var(--muted-foreground)] text-sm w-6">{i + 1}</span>
                      <span className="font-medium text-[var(--foreground)]">{player.name}</span>
                      {player.averageRating && (
                        <span className="ml-auto text-sm text-[var(--muted-foreground)]">
                          {player.averageRating.toFixed(1)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center text-sm font-bold">
                    B
                  </span>
                  Equipo B
                </h2>
                <ul className="space-y-2">
                  {result.teamB.map((player, i) => (
                    <li key={player.id} className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
                      <span className="text-[var(--muted-foreground)] text-sm w-6">{i + 1}</span>
                      <span className="font-medium text-[var(--foreground)]">{player.name}</span>
                      {player.averageRating && (
                        <span className="ml-auto text-sm text-[var(--muted-foreground)]">
                          {player.averageRating.toFixed(1)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-3.5 bg-[var(--secondary)] text-[var(--foreground)] font-semibold rounded-xl hover:opacity-80 transition-all border border-[var(--border)]"
              >
                Volver a seleccionar
              </button>
              <button
                onClick={() => router.push(`/dashboard/groups/${groupId}`)}
                className="flex-1 py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Ver grupo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[var(--muted-foreground)]">
                {selected.length} de {players.length} seleccionados
              </span>
              <button
                onClick={selectAll}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                {selected.length === players.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>

            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] mb-6">
              {players.map((player) => (
                <label
                  key={player.id}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--secondary)] transition-colors ${
                    selected.includes(player.id) ? 'bg-[var(--primary)]/5' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(player.id)}
                    onChange={() => togglePlayer(player.id)}
                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <span className="font-medium text-[var(--foreground)]">{player.name}</span>
                  <span className="ml-auto text-sm text-[var(--muted-foreground)]">
                    {player.averageRating ? `⭐ ${player.averageRating.toFixed(1)}` : 'Sin puntaje'}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || selected.length < 4}
              className="w-full py-4 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando equipos...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generar Equipos
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
