import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createIncompatibilitySchema = z.object({
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
  type: z.enum(['CANNOT_FACE_EACH_OTHER', 'MUST_BE_ON_SAME_TEAM']).default('CANNOT_FACE_EACH_OTHER'),
  reason: z.string().max(255).optional()
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
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

    const incompatibilities = await prisma.playerIncompatibility.findMany({
      where: { groupId },
      include: {
        player1: true,
        player2: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(incompatibilities)
  } catch (error) {
    console.error('Error fetching incompatibilities:', error)
    return NextResponse.json({ error: 'Error al obtener incompatibilidades' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params
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
      return NextResponse.json({ error: 'Solo los administradores pueden crear restricciones' }, { status: 403 })
    }

    const body = await request.json()
    const { player1Id, player2Id, type, reason } = createIncompatibilitySchema.parse(body)

    // Validar que no sean el mismo jugador
    if (player1Id === player2Id) {
      return NextResponse.json({ error: 'Un jugador no puede tener restricción consigo mismo' }, { status: 400 })
    }

    // Validar que ambos jugadores existan en el grupo
    const [player1, player2] = await Promise.all([
      prisma.player.findFirst({ where: { id: player1Id, groupId } }),
      prisma.player.findFirst({ where: { id: player2Id, groupId } })
    ])

    if (!player1 || !player2) {
      return NextResponse.json({ error: 'Uno o ambos jugadores no existen en el grupo' }, { status: 404 })
    }

    // Crear restricción (normalizar para evitar duplicados)
    const [normalizedPlayer1Id, normalizedPlayer2Id] = 
      player1Id < player2Id ? [player1Id, player2Id] : [player2Id, player1Id]

    try {
      const incompatibility = await prisma.playerIncompatibility.create({
        data: {
          groupId,
          player1Id: normalizedPlayer1Id,
          player2Id: normalizedPlayer2Id,
          type,
          reason: reason || null
        },
        include: {
          player1: true,
          player2: true
        }
      })

      return NextResponse.json(incompatibility, { status: 201 })
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Ya existe una restricción entre estos jugadores' },
          { status: 409 }
        )
      }
      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating incompatibility:', error)
    return NextResponse.json({ error: 'Error al crear restricción' }, { status: 500 })
  }
}
