import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { groupId, memberId } = await params

    // El usuario actual debe ser admin del grupo.
    const currentMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    if (!currentMembership || currentMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar miembros' }, { status: 403 })
    }

    // El miembro a eliminar debe existir y pertenecer a este grupo.
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId }
    })

    if (!member || member.groupId !== groupId) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    // Un admin no puede eliminarse a sí mismo desde acá.
    if (member.userId === session.user.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo del grupo' }, { status: 400 })
    }

    // Elimina la membresía y los puntajes que ese usuario dio dentro del grupo,
    // recalculando el promedio de los jugadores afectados.
    await prisma.$transaction(async (tx) => {
      const ratings = await tx.rating.findMany({
        where: { userId: member.userId, player: { groupId } },
        select: { playerId: true }
      })
      const affectedPlayerIds = [...new Set(ratings.map((r) => r.playerId))]

      await tx.rating.deleteMany({
        where: { userId: member.userId, player: { groupId } }
      })

      await tx.groupMember.delete({ where: { id: memberId } })

      for (const playerId of affectedPlayerIds) {
        const remaining = await tx.rating.findMany({
          where: { playerId },
          select: { score: true }
        })
        const averageRating = remaining.length > 0
          ? remaining.reduce((sum, r) => sum + r.score, 0) / remaining.length
          : null
        await tx.player.update({
          where: { id: playerId },
          data: { averageRating }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Error al eliminar miembro' }, { status: 500 })
  }
}
