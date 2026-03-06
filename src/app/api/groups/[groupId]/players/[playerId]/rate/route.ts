import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ratePlayerSchema = z.object({
  score: z.number().int().min(1).max(10)
})

export async function POST(
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

    const body = await request.json()
    const { score } = ratePlayerSchema.parse(body)

    const rating = await prisma.rating.upsert({
      where: {
        playerId_userId: {
          playerId,
          userId: session.user.id
        }
      },
      update: { score },
      create: {
        playerId,
        userId: session.user.id,
        score
      }
    })

    const allRatings = await prisma.rating.findMany({
      where: { playerId }
    })

    const average = allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length

    await prisma.player.update({
      where: { id: playerId },
      data: { averageRating: average }
    })

    return NextResponse.json(rating)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error rating player:', error)
    return NextResponse.json({ error: 'Error al puntuar jugador' }, { status: 500 })
  }
}
