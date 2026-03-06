import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const group = await prisma.group.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true, name: true }
    })

    if (!group) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Error al obtener grupo' }, { status: 500 })
  }
}
