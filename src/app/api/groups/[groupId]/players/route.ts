import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const playerSchema = z.object({
  name: z.string().min(1).max(100)
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

    const players = await prisma.player.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Error al obtener jugadores' }, { status: 500 })
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

    const body = await request.json()
    const { name } = playerSchema.parse(body)

    const player = await prisma.player.create({
      data: {
        name,
        groupId
      }
    })

    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Error al crear jugador' }, { status: 500 })
  }
}
