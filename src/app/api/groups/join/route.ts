import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Limita el tanteo de códigos (evita adivinar códigos de grupo por fuerza bruta).
    const limit = rateLimit(`join:${getClientIp(request)}:${session.user.id}`, 20, 10 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    const group = await prisma.group.findUnique({
      where: { code: normalizedCode }
    })

    if (!group) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 404 })
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Ya eres miembro de este grupo' }, { status: 400 })
    }

    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: 'MEMBER'
      }
    })

    return NextResponse.json({ success: true, groupId: group.id })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json({ error: 'Error al unirse al grupo' }, { status: 500 })
  }
}
