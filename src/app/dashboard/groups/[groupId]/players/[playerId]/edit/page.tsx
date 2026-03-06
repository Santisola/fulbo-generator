'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function EditPlayerPage({
  params,
}: {
  params: Promise<{ groupId: string; playerId: string }>
}) {
  const { groupId, playerId } = use(params)
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPlayer() {
      const res = await fetch(`/api/groups/${groupId}/players/${playerId}`)
      if (res.ok) {
        const data = await res.json()
        setName(data.name)
      }
    }
    fetchPlayer()
  }, [groupId, playerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/groups/${groupId}/players/${playerId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al actualizar jugador')
        setLoading(false)
        return
      }

      router.push(`/dashboard/groups/${groupId}`)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este jugador?')) return

    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/groups/${groupId}/players/${playerId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al eliminar jugador')
        setDeleting(false)
        return
      }

      router.push(`/dashboard/groups/${groupId}`)
    } catch {
      setError('Error de conexión')
      setDeleting(false)
    }
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
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Editar Jugador</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[var(--muted-foreground)] text-sm font-medium mb-2">
                Nombre del Jugador
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-3.5 bg-red-500/10 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50 border border-red-500/20"
            >
              {deleting ? 'Eliminando...' : 'Eliminar Jugador'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
