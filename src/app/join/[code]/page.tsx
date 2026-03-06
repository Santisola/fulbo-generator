'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function JoinGroupPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [groupName, setGroupName] = useState('')

  useEffect(() => {
    async function fetchGroup() {
      const res = await fetch(`/api/groups/info/${code}`)
      if (res.ok) {
        const data = await res.json()
        setGroupName(data.name)
      } else {
        setError('Código de invitación inválido')
      }
    }
    if (code) {
      fetchGroup()
    }
  }, [code])

  useEffect(() => {
    if (session) {
      handleJoin()
    }
  }, [session])

  const handleJoin = async () => {
    if (!session) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al unirse al grupo')
        setLoading(false)
        return
      }

      router.push(`/dashboard/groups/${data.groupId}`)
    } catch {
      setError('Error de conexión')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[var(--muted-foreground)]">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            Unirse a {groupName || 'Grupo'}
          </h1>
          <p className="text-[var(--muted-foreground)] mb-6">
            Necesitás iniciar sesión para unirte al grupo
          </p>
          <button
            onClick={() => signIn()}
            className="w-full py-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="text-center">
        {error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        ) : (
          <>
            <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[var(--muted-foreground)]">Uniéndote a {groupName}...</p>
          </>
        )}
      </div>
    </div>
  )
}
