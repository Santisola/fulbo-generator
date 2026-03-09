import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { groupId, memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    // Verificar que el usuario actual es admin del grupo
    const currentUserMembership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    if (!currentUserMembership || currentUserMembership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Solo admins pueden cambiar roles' }, { status: 403 })
    }

    // Verificar que el miembro a modificar existe en el grupo
    const memberToUpdate = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: { group: true }
    })

    if (!memberToUpdate || memberToUpdate.groupId !== groupId) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    // Evitar que el único admin se quite a sí mismo el rol
    if (memberToUpdate.userId === session.user.id && role === 'MEMBER') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: 'ADMIN'
        }
      })

      if (adminCount === 1) {
        return NextResponse.json({ 
          error: 'No puedes quitarte el rol de admin siendo el único administrador' 
        }, { status: 400 })
      }
    }

    // Actualizar el rol
    const updatedMember = await prisma.groupMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true }
    })

    return NextResponse.json({ 
      success: true, 
      member: {
        id: updatedMember.id,
        userId: updatedMember.userId,
        role: updatedMember.role,
        user: {
          name: updatedMember.user.name,
          email: updatedMember.user.email
        }
      }
    })
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 })
  }
}
