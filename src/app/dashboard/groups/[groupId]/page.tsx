import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'
import GroupMembersClient from '@/components/GroupMembersClient'

async function getGroup(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: true
            }
          },
          players: {
            include: {
              ratings: true
            }
          },
          teamHistory: {
            orderBy: { generatedAt: 'desc' },
            take: 20
          }
        }
      }
    }
  })

  return membership?.group
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const { groupId } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const group = await getGroup(groupId, session.user.id)

  if (!group) {
    redirect('/dashboard')
  }

  const isAdmin = group.members.some(
    (m) => m.userId === session.user.id && m.role === 'ADMIN'
  )

  const playerNameById = new Map(group.players.map((p) => [p.id, p.name]))

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-4">
          <Link href="/dashboard" className="hover:text-[var(--foreground)]">Grupos</Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{group.name}</span>
        </div>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{group.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-[var(--muted-foreground)]">
              <span>{group.members.length} miembros</span>
              <span className="text-[var(--border)]">|</span>
              <span>{group.players.length} jugadores</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[var(--card)] px-4 py-2.5 rounded-xl border border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">Código:</span>
            <code className="font-mono font-bold text-lg text-[var(--primary)]">{group.code}</code>
            <CopyButton code={group.code} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-8 lg:grid-cols-2">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">Jugadores</h2>
            {isAdmin && (
              <Link
                href={`/dashboard/groups/${groupId}/players/new`}
                className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] text-sm rounded-lg font-medium hover:opacity-90"
              >
                + Agregar
              </Link>
            )}
          </div>
          
          {group.players.length === 0 ? (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--muted-foreground)] mb-4">No hay jugadores agregados</p>
              {isAdmin && (
                <Link
                  href={`/dashboard/groups/${groupId}/players/new`}
                  className="inline-block px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl"
                >
                  Agregar primer jugador
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
              {group.players.map((player) => {
                const myRating = player.ratings.find((r) => r.userId === session.user.id)
                return (
                   <div key={player.id} className="p-4 flex justify-between items-center">
                     <span className="font-medium text-[var(--foreground)]">{player.name}</span>
                     <div className="flex items-center gap-3">
                       {myRating ? (
                         <div className="flex items-center gap-3">
                           <span className="text-sm text-[var(--muted-foreground)]">
                             Tu puntaje: <strong className="text-[var(--foreground)]">{myRating.score}</strong>
                           </span>
                           <Link
                             href={`/dashboard/groups/${groupId}/players/${player.id}/rate`}
                             className="text-sm text-[var(--primary)] hover:underline"
                           >
                             Editar
                           </Link>
                         </div>
                       ) : (
                         <Link
                           href={`/dashboard/groups/${groupId}/players/${player.id}/rate`}
                           className="text-sm text-[var(--primary)] hover:underline"
                         >
                           Puntuar
                         </Link>
                       )}
                       {isAdmin && (
                         <Link
                           href={`/dashboard/groups/${groupId}/players/${player.id}/edit`}
                           className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                           </svg>
                         </Link>
                       )}
                     </div>
                   </div>
                )
              })}
            </div>
          )}

          {group.players.length >= 4 && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {isAdmin && (
                <Link
                  href={`/dashboard/groups/${groupId}/incompatibilities`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--secondary)] text-[var(--foreground)] font-semibold rounded-xl hover:opacity-90 transition-all border border-[var(--border)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h3a2 2 0 002-2v-6zm6-4h.01M19 11a2 2 0 11-4 0 2 2 0 014 0zm0 4a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Incompatibilidades
                </Link>
              )}
              <Link
                href={`/dashboard/groups/${groupId}/generate`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generar Equipos
              </Link>
            </div>
          )}

        </div>

        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Miembros</h2>
          
          <GroupMembersClient
            members={group.members}
            groupId={groupId}
            isAdmin={isAdmin}
            currentUserId={session.user.id}
          />

          {group.teamHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Historial</h2>
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
                {group.teamHistory.slice(0, 5).map((history) => {
                  const teamA = (JSON.parse(history.teamA) as string[])
                    .map((id) => playerNameById.get(id) ?? 'Jugador eliminado')
                  const teamB = (JSON.parse(history.teamB) as string[])
                    .map((id) => playerNameById.get(id) ?? 'Jugador eliminado')
                  return (
                    <div key={history.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {new Date(history.generatedAt).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Dif. {history.averageDiff.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-5 h-5 bg-blue-500/20 text-blue-500 rounded-full flex items-center justify-center text-xs font-bold">A</span>
                          </div>
                          <ul className="space-y-0.5 text-[var(--foreground)]">
                            {teamA.map((name, i) => (
                              <li key={i}>{name}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="w-5 h-5 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center text-xs font-bold">B</span>
                          </div>
                          <ul className="space-y-0.5 text-[var(--foreground)]">
                            {teamB.map((name, i) => (
                              <li key={i}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
