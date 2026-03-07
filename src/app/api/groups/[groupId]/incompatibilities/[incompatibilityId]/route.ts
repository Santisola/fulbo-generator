import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string; incompatibilityId: string }> }
) {
  try {
    const { groupId, incompatibilityId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es admin del grupo
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los administradores pueden eliminar restricciones' }, { status: 403 })
    }

    // Verificar que la restricción existe en el grupo
    const incompatibility = await prisma.playerIncompatibility.findFirst({
      where: {
        id: incompatibilityId,
        groupId
      }
    })

    if (!incompatibility) {
      return NextResponse.json({ error: 'Restricción no encontrada' }, { status: 404 })
    }

    await prisma.playerIncompatibility.delete({
      where: { id: incompatibilityId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting incompatibility:', error)
    return NextResponse.json({ error: 'Error al eliminar restricción' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ groupId: string; incompatibilityId: string }> }
) {
  try {
    const { groupId, incompatibilityId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que es admin del grupo
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo los administradores pueden editar restricciones' }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = body

    const incompatibility = await prisma.playerIncompatibility.update({
      where: { id: incompatibilityId },
      data: { reason: reason || null },
      include: {
        player1: true,
        player2: true
      }
    })

    return NextResponse.json(incompatibility)
  } catch (error) {
    console.error('Error updating incompatibility:', error)
    return NextResponse.json({ error: 'Error al actualizar restricción' }, { status: 500 })
  }
}
