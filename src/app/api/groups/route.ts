import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const createGroupSchema = z.object({
  name: z.string().min(2).max(50)
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = createGroupSchema.parse(body)

    let code: string
    let attempts = 0
    
    do {
      code = generateCode()
      attempts++
      if (attempts > 10) {
        return NextResponse.json({ error: 'Error al generar código único' }, { status: 500 })
      }
    } while (await prisma.group.findUnique({ where: { code } }))

    const group = await prisma.group.create({
      data: {
        name,
        code,
        createdById: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: true,
        players: true
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Error al crear grupo' }, { status: 500 })
  }
}
