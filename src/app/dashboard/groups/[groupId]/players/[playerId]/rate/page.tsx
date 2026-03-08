'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

interface PlayerData {
  player: { id: string; name: string }
  rating: number | null
}

export default function RatePlayerPage({
  params,
}: {
  params: Promise<{ groupId: string; playerId: string }>
}) {
  const { groupId, playerId } = use(params)
  const router = useRouter()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [score, setScore] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    async function fetchPlayerData() {
      try {
        const res = await fetch(`/api/groups/${groupId}/players/${playerId}/rate`)
        if (res.ok) {
          const data: PlayerData = await res.json()
          setPlayerData(data)
          if (data.rating !== null) {
            setScore(data.rating)
            setIsEditing(true)
          }
        }
      } catch (err) {
        console.error('Error fetching player data:', err)
      }
    }
    fetchPlayerData()
  }, [groupId, playerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/groups/${groupId}/players/${playerId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al puntuar jugador')
        setLoading(false)
        return
      }

      router.push(`/dashboard/groups/${groupId}`)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  if (!playerData) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {isEditing ? 'Editar puntaje de ' : 'Puntuar a '}{playerData.player.name}
          </h1>
          <p className="text-[var(--muted-foreground)] mb-8">
            {isEditing 
              ? 'Actualiza el puntaje según el desempeño actual del jugador'
              : 'Tu puntaje es oculto para los demás miembros'
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            {isEditing && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                Puntaje anterior: <strong>{playerData.rating}</strong>
              </div>
            )}

            <div>
              <label className="block text-[var(--muted-foreground)] text-sm font-medium mb-4">
                Nivel del jugador (1-10)
              </label>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[var(--muted-foreground)]">1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="flex-1 h-8 bg-[var(--input)] rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />
                <span className="text-2xl font-bold text-[var(--muted-foreground)]">10</span>
              </div>
              <div className="text-center mt-6">
                <span className="text-6xl font-bold text-[var(--primary)]">{score}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar Puntaje' : 'Guardar Puntaje'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

