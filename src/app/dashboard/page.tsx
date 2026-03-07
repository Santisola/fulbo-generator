import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

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
    <DashboardClient groups={groups} />
  )
}

