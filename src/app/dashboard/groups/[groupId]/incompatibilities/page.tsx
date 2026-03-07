'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { use } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  name: string
}

interface Incompatibility {
  id: string
  player1Id: string
  player2Id: string
  player1: Player
  player2: Player
  reason: string | null
  createdAt: string
}

export default function IncompatibilitiesPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = use(params)
  const router = useRouter()
  const [incompatibilities, setIncompatibilities] = useState<Incompatibility[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlayer1, setSelectedPlayer1] = useState('')
  const [selectedPlayer2, setSelectedPlayer2] = useState('')
  const [reason, setReason] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingReason, setEditingReason] = useState('')

  useEffect(() => {
    fetchData()
  }, [groupId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [incompatRes, playersRes] = await Promise.all([
        fetch(`/api/groups/${groupId}/incompatibilities`),
        fetch(`/api/groups/${groupId}/players`)
      ])

      if (incompatRes.ok) {
        setIncompatibilities(await incompatRes.json())
      }

      if (playersRes.ok) {
        setPlayers(await playersRes.json())
      }
    } catch (err) {
      setError('Error al cargar datos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIncompatibility = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    if (!selectedPlayer1 || !selectedPlayer2) {
      setError('Debes seleccionar dos jugadores')
      setCreating(false)
      return
    }

    if (selectedPlayer1 === selectedPlayer2) {
      setError('No puedes seleccionar el mismo jugador dos veces')
      setCreating(false)
      return
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/incompatibilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player1Id: selectedPlayer1,
          player2Id: selectedPlayer2,
          reason: reason || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear incompatibilidad')
        setCreating(false)
        return
      }

      setIncompatibilities([data, ...incompatibilities])
      setSelectedPlayer1('')
      setSelectedPlayer2('')
      setReason('')
    } catch (err) {
      setError('Error de conexión')
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteIncompatibility = async (incompatibilityId: string) => {
    if (!confirm('¿Estás seguro que deseas eliminar esta incompatibilidad?')) {
      return
    }

    try {
      const res = await fetch(`/api/groups/${groupId}/incompatibilities/${incompatibilityId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setIncompatibilities(incompatibilities.filter(i => i.id !== incompatibilityId))
      } else {
        setError('Error al eliminar incompatibilidad')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error(err)
    }
  }

  const handleUpdateReason = async (incompatibilityId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/incompatibilities/${incompatibilityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: editingReason })
      })

      const data = await res.json()

      if (res.ok) {
        setIncompatibilities(
          incompatibilities.map(i => 
            i.id === incompatibilityId ? data : i
          )
        )
        setEditingId(null)
        setEditingReason('')
      } else {
        setError('Error al actualizar')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[var(--muted-foreground)]">Cargando...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-4">
          <Link href="/dashboard" className="hover:text-[var(--foreground)]">
            Grupos
          </Link>
          <span>/</span>
          <Link href={`/dashboard/groups/${groupId}`} className="hover:text-[var(--foreground)]">
            Grupo
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">Incompatibilidades</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          Incompatibilidades de Jugadores
        </h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Configura qué jugadores no pueden jugar en equipos enfrentados
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Agregar Incompatibilidad
            </h2>

            <form onSubmit={handleCreateIncompatibility} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Primer jugador
                </label>
                <select
                  value={selectedPlayer1}
                  onChange={(e) => setSelectedPlayer1(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">Selecciona un jugador</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Segundo jugador
                </label>
                <select
                  value={selectedPlayer2}
                  onChange={(e) => setSelectedPlayer2(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">Selecciona un jugador</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
                  Razón (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Conflicto personal, hermanos, etc."
                  maxLength={255}
                  className="w-full px-3 py-2 bg-[var(--input)] border border-[var(--border)] rounded-lg text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-[var(--primary)] text-[var(--primary-foreground)] font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear Incompatibilidad'}
              </button>
            </form>
          </div>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)]">
            {incompatibilities.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--muted-foreground)]">
                  No hay incompatibilidades configuradas
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {incompatibilities.map(incompat => (
                  <div key={incompat.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {incompat.player1.name} ↔ {incompat.player2.name}
                        </p>
                        {incompat.reason && (
                          <p className="text-sm text-[var(--muted-foreground)] mt-1">
                            {editingId === incompat.id ? (
                              <textarea
                                value={editingReason}
                                onChange={(e) => setEditingReason(e.target.value)}
                                maxLength={255}
                                className="w-full px-2 py-1 bg-[var(--input)] border border-[var(--border)] rounded text-sm text-[var(--foreground)] resize-none"
                                rows={2}
                              />
                            ) : (
                              incompat.reason
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingId === incompat.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateReason(incompat.id)}
                              className="px-3 py-1 text-xs bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:opacity-90"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 text-xs bg-[var(--secondary)] text-[var(--foreground)] rounded hover:opacity-90"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(incompat.id)
                                setEditingReason(incompat.reason || '')
                              }}
                              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteIncompatibility(incompat.id)}
                              className="text-red-400 hover:text-red-500 text-sm"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(incompat.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
