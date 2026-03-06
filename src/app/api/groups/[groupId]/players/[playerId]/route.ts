import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    if (!membership) {
      return NextResponse.json({ error: 'No eres miembro del grupo' }, { status: 403 })
    }

    const player = await prisma.player.findFirst({
      where: { id: playerId, groupId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json({ error: 'Error al obtener jugador' }, { status: 500 })
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Solo admins pueden eliminar jugadores' }, { status: 403 })
    }

    const player = await prisma.player.findFirst({
      where: { id: playerId, groupId }
    })

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    await prisma.player.delete({
      where: { id: playerId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Error al eliminar jugador' }, { status: 500 })
  }
}
