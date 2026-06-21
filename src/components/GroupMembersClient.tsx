'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  userId: string
  role: 'ADMIN' | 'MEMBER'
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface GroupMembersClientProps {
  members: Member[]
  groupId: string
  isAdmin: boolean
  currentUserId: string
}

export default function GroupMembersClient({
  members,
  groupId,
  isAdmin,
  currentUserId
}: GroupMembersClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRoleChange = async (memberId: string, newRole: 'ADMIN' | 'MEMBER') => {
    setError(null)
    setLoading(memberId)

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members/${memberId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cambiar rol')
        return
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(null)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`¿Eliminar a ${memberName} del grupo? Se borrarán los puntajes que haya cargado.`)) {
      return
    }

    setError(null)
    setLoading(memberId)

    try {
      const response = await fetch(
        `/api/groups/${groupId}/members/${memberId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al eliminar miembro')
        return
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
        {members.map((member) => (
          <div key={member.id} className="p-4 flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                </span>
              </div>
              <div>
                <span className="font-medium text-[var(--foreground)]">
                  {member.user.name || member.user.email}
                </span>
                {currentUserId === member.userId && (
                  <p className="text-xs text-[var(--muted-foreground)]">(Tú)</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {member.role === 'ADMIN' && (
                <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full font-medium">
                  Admin
                </span>
              )}
              
              {isAdmin && currentUserId !== member.userId && (
                <>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as 'ADMIN' | 'MEMBER')
                    }
                    disabled={loading === member.id}
                    className="text-sm px-3 py-1.5 bg-[var(--secondary)] border border-[var(--border)] rounded-lg text-[var(--foreground)] cursor-pointer hover:border-[var(--primary)]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="MEMBER">Miembro</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    onClick={() =>
                      handleRemoveMember(member.id, member.user.name || member.user.email)
                    }
                    disabled={loading === member.id}
                    title="Eliminar miembro"
                    aria-label={`Eliminar a ${member.user.name || member.user.email}`}
                    className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
