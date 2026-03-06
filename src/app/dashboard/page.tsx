import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

async function getGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: true,
          players: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })
  return memberships.map((m) => m.group)
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const groups = await getGroups(session.user.id)

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Mis Grupos</h1>
        <Link
          href="/dashboard/groups/new"
          className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-medium hover:opacity-90 transition-all"
        >
          + Crear Grupo
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-[var(--secondary)] rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No tenés grupos</h3>
          <p className="text-[var(--muted-foreground)] mb-6">Creá un grupo o unite a uno existente</p>
          <Link
            href="/dashboard/groups/new"
            className="inline-block px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-medium hover:opacity-90"
          >
            Crear mi primer grupo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/dashboard/groups/${group.id}`}
              className="block p-6 bg-[var(--card)] rounded-2xl border border-[var(--border)] hover:border-[var(--primary)]/50 transition-all hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">
                {group.name}
              </h3>
              <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
                <span>{group.members.length} miembros</span>
                <span>•</span>
                <span>{group.players.length} jugadores</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">Código:</span>
                <code className="px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-sm font-mono text-[var(--primary)]">
                  {group.code}
                </code>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Unirse a un grupo
        </h2>
        <form action="/api/groups/join" method="POST" className="flex gap-4">
          <input
            type="text"
            name="code"
            placeholder="Ingresa el código de invitación"
            className="flex-1 px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            required
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[var(--secondary)] text-[var(--foreground)] rounded-xl hover:bg-[var(--accent)] transition-colors border border-[var(--border)]"
          >
            Unirse
          </button>
        </form>
      </div>
    </div>
  )
}
