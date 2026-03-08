import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CopyButton } from '@/components/CopyButton'

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

      <div className="grid gap-8 lg:grid-cols-2">
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
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Miembros</h2>
          
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {group.members.map((member) => (
              <div key={member.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[var(--secondary)] rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-[var(--foreground)]">
                    {member.user.name || member.user.email}
                  </span>
                </div>
                {member.role === 'ADMIN' && (
                  <span className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
            ))}
          </div>

          {group.teamHistory.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">Historial</h2>
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
                {group.teamHistory.slice(0, 5).map((history) => {
                  const teamA = JSON.parse(history.teamA)
                  const teamB = JSON.parse(history.teamB)
                  return (
                    <div key={history.id} className="p-4">
                      <div className="text-sm text-[var(--muted-foreground)] mb-2">
                        {new Date(history.generatedAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-[var(--foreground)]">Equipo A: {teamA.length} jugadores</span>
                        <span className="text-[var(--foreground)]">Equipo B: {teamB.length} jugadores</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

       {group.players.length >= 4 && (
         <div className="mt-8 flex gap-4">
           {isAdmin && (
             <Link
               href={`/dashboard/groups/${groupId}/incompatibilities`}
               className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--secondary)] text-[var(--foreground)] font-semibold rounded-xl hover:opacity-90 transition-all border border-[var(--border)]"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h3a2 2 0 002-2v-6zm6-4h.01M19 11a2 2 0 11-4 0 2 2 0 014 0zm0 4a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
               Incompatibilidades
             </Link>
           )}
           <Link
             href={`/dashboard/groups/${groupId}/generate`}
             className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-xl hover:opacity-90 transition-all"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             Generar Equipos
           </Link>
         </div>
       )}
    </div>
  )
}
