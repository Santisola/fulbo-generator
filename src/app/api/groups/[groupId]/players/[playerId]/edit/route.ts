import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const editPlayerSchema = z.object({
  name: z.string().min(2).max(50)
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ groupId: string; playerId: string }> }
) {
  try {
    const { groupId, playerId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins pueden editar jugadores' }, { status: 403 })
    }

    const player = await prisma.player.findFirst({
      where: { id: playerId, groupId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { name } = editPlayerSchema.parse(body)

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: { name }
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error editing player:', error)
    return NextResponse.json({ error: 'Error al editar jugador' }, { status: 500 })
  }
}
