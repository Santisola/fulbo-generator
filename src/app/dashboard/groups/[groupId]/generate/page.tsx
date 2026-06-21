'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'

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
  const [playersLoading, setPlayersLoading] = useState(true)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    teamA: Player[]
    teamB: Player[]
    averageDiff: number
  } | null>(null)

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch(`/api/groups/${groupId}/players`)
        if (res.ok) {
          setPlayers(await res.json())
        } else {
          setError('No se pudieron cargar los jugadores')
        }
      } catch {
        setError('Error de conexión al cargar los jugadores')
      } finally {
        setPlayersLoading(false)
      }
    }
    fetchPlayers()
  }, [groupId])

  // Sólo se pueden repartir jugadores con puntaje: uno sin puntuar contaría
  // como 0 y desbalancearía los equipos.
  const ratedPlayers = players.filter(p => p.averageRating !== null)

  const togglePlayer = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selected.length === ratedPlayers.length) {
      setSelected([])
    } else {
      setSelected(ratedPlayers.map(p => p.id))
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

  const formatTeamsMessage = () => {
    if (!result) return ''

    const teamAList = result.teamA
      .map((player, i) => `${i + 1}. ${player.name}`)
      .join('\n')

    const teamBList = result.teamB
      .map((player, i) => `${i + 1}. ${player.name}`)
      .join('\n')

    return `\n${teamAList}\n\n\n${teamBList}`
  }

  const handleShareWhatsApp = () => {
    const message = formatTeamsMessage()
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  // Traduce la diferencia de medias (escala 1-10) a una lectura comprensible.
  const describeBalance = (diff: number) => {
    if (diff < 0.3) return { label: 'Equipos muy parejos', emoji: '✅' }
    if (diff < 0.7) return { label: 'Equipos parejos', emoji: '👍' }
    if (diff < 1.2) return { label: 'Diferencia moderada', emoji: '⚖️' }
    return { label: 'Equipos algo desparejos', emoji: '⚠️' }
  }

  return (
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
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {result ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-center">
              <p className="text-lg font-semibold text-[var(--foreground)]">
                {describeBalance(result.averageDiff).emoji} {describeBalance(result.averageDiff).label}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Diferencia de media entre equipos: <strong className="text-[var(--foreground)]">{result.averageDiff.toFixed(2)}</strong> puntos
              </p>
            </div>

            <div className="grid gap-3 sm:gap-6 md:grid-cols-2">
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
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-bold">
                    B
                  </span>
                  Equipo B
                </h2>
                <ul className="space-y-2">
                  {result.teamB.map((player, i) => (
                    <li key={player.id} className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
                      <span className="text-[var(--muted-foreground)] text-sm w-6">{i + 1}</span>
                      <span className="font-medium text-[var(--foreground)]">{player.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              <button
                onClick={() => setResult(null)}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3.5 text-center text-sm font-semibold leading-tight text-[var(--foreground)] transition-all hover:opacity-80 sm:text-base"
              >
                Volver a seleccionar
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-center text-sm font-semibold leading-tight text-white transition-all hover:bg-green-700 sm:text-base"
              >
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12.75L12 7.75m0 0l5 5m-5-5v8.5M5.75 16.75v1.5A1.75 1.75 0 007.5 20h9a1.75 1.75 0 001.75-1.75v-1.5"
                  />
                </svg>
                Compartir por WhatsApp
              </button>
              <button
                onClick={() => router.push(`/dashboard/groups/${groupId}`)}
                className="inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3.5 text-center text-sm font-semibold leading-tight text-[var(--primary-foreground)] transition-all hover:opacity-90 sm:text-base"
              >
                Ver grupo
              </button>
            </div>
          </div>
        ) : playersLoading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-8 h-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : players.length === 0 ? (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center text-[var(--muted-foreground)]">
            Este grupo todavía no tiene jugadores.
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[var(--muted-foreground)]">
                {selected.length} de {ratedPlayers.length} seleccionados
              </span>
              {ratedPlayers.length > 0 && (
                <button
                  onClick={selectAll}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  {selected.length === ratedPlayers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>

            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] mb-6">
              {players.map((player) => {
                const isRated = player.averageRating !== null
                return (
                  <label
                    key={player.id}
                    className={`flex items-center gap-4 p-4 transition-colors ${
                      isRated
                        ? `cursor-pointer hover:bg-[var(--secondary)] ${selected.includes(player.id) ? 'bg-[var(--primary)]/5' : ''}`
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      disabled={!isRated}
                      className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] disabled:cursor-not-allowed"
                    />
                    <span className="font-medium text-[var(--foreground)]">{player.name}</span>
                    {isRated ? (
                      <span className="ml-auto text-sm text-[var(--muted-foreground)]">
                        {player.averageRating!.toFixed(1)}
                      </span>
                    ) : (
                      <span className="ml-auto text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-1 rounded-full">
                        Sin puntaje
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            {ratedPlayers.length < 4 && (
              <div className="mb-6 p-3 rounded-lg bg-[var(--secondary)] text-[var(--muted-foreground)] text-sm text-center">
                Necesitás al menos 4 jugadores con puntaje para generar equipos.
                {players.length > ratedPlayers.length && ' Puntuá a los jugadores marcados como "Sin puntaje".'}
              </div>
            )}

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
  )
}
