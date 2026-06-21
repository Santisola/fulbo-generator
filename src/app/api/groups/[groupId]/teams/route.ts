import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PlayerWithRating {
  id: string
  name: string
  averageRating: number | null
}

type Cluster = PlayerWithRating[]

// En una partición de 2 equipos, tanto CANNOT_FACE_EACH_OTHER ("no pueden
// enfrentarse") como MUST_BE_ON_SAME_TEAM obligan a dos jugadores a quedar en
// el mismo equipo. Agrupamos esos jugadores en "clusters" con union-find, de
// modo que las restricciones queden satisfechas por construcción.
function buildClusters(
  players: PlayerWithRating[],
  incompatibilities: { player1Id: string; player2Id: string }[]
): Cluster[] {
  const parent: Record<string, string> = {}
  const byId: Record<string, PlayerWithRating> = {}
  players.forEach(p => {
    parent[p.id] = p.id
    byId[p.id] = p
  })

  const find = (x: string): string => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }
  const union = (a: string, b: string) => {
    parent[find(a)] = find(b)
  }

  incompatibilities.forEach(({ player1Id, player2Id }) => {
    // Sólo une jugadores que efectivamente participan de esta generación.
    if (parent[player1Id] !== undefined && parent[player2Id] !== undefined) {
      union(player1Id, player2Id)
    }
  })

  const groups: Record<string, Cluster> = {}
  players.forEach(p => {
    const root = find(p.id)
    if (!groups[root]) groups[root] = []
    groups[root].push(byId[p.id])
  })

  return Object.values(groups)
}

function clusterRating(cluster: Cluster): number {
  return cluster.reduce((sum, p) => sum + (p.averageRating || 0), 0)
}

function calculateDiff(teamA: PlayerWithRating[], teamB: PlayerWithRating[]): number {
  if (teamA.length === 0 || teamB.length === 0) return Infinity

  const avgA = teamA.reduce((sum, p) => sum + (p.averageRating || 0), 0) / teamA.length
  const avgB = teamB.reduce((sum, p) => sum + (p.averageRating || 0), 0) / teamB.length

  return Math.abs(avgA - avgB)
}

// Reparto greedy: recorre los clusters y asigna cada uno al equipo con menor
// puntaje acumulado, respetando el tope de tamaño para que los equipos queden
// parejos en cantidad. El orden de entrada se aleatoriza afuera para generar
// variantes entre llamadas.
function assignClusters(
  clusters: Cluster[],
  totalPlayers: number
): { teamA: PlayerWithRating[]; teamB: PlayerWithRating[] } {
  const maxSize = Math.ceil(totalPlayers / 2)
  const teamA: PlayerWithRating[] = []
  const teamB: PlayerWithRating[] = []
  let sumA = 0
  let sumB = 0

  for (const cluster of clusters) {
    const rating = clusterRating(cluster)
    const fitsA = teamA.length + cluster.length <= maxSize
    const fitsB = teamB.length + cluster.length <= maxSize

    let toA: boolean
    if (fitsA && !fitsB) toA = true
    else if (!fitsA && fitsB) toA = false
    else toA = sumA <= sumB // ambos entran (o ninguno): balancear por puntaje

    if (toA) {
      teamA.push(...cluster)
      sumA += rating
    } else {
      teamB.push(...cluster)
      sumB += rating
    }
  }

  return { teamA, teamB }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function isRecentDuplicate(
  recentHistory: { teamA: string; teamB: string }[],
  teamA: string[],
  teamB: string[]
): boolean {
  for (const history of recentHistory) {
    const prevA = new Set(JSON.parse(history.teamA) as string[])
    const prevB = new Set(JSON.parse(history.teamB) as string[])

    const aMatches = teamA.length === prevA.size && teamA.every(id => prevA.has(id))
    const bMatches = teamB.length === prevB.size && teamB.every(id => prevB.has(id))
    // Comparar ambas orientaciones (A↔B es el mismo reparto).
    const swappedA = teamA.length === prevB.size && teamA.every(id => prevB.has(id))
    const swappedB = teamB.length === prevA.size && teamB.every(id => prevA.has(id))

    if ((aMatches && bMatches) || (swappedA && swappedB)) {
      return true
    }
  }
  return false
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
    const { playerIds } = body

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 4) {
      return NextResponse.json({ 
        error: 'Se necesitan al menos 4 jugadores para generar equipos' 
      }, { status: 400 })
    }

    const players = await prisma.player.findMany({
      where: {
        id: { in: playerIds },
        groupId
      },
      select: {
        id: true,
        name: true,
        averageRating: true
      }
    })

    if (players.length !== playerIds.length) {
      return NextResponse.json({ error: 'Algunos jugadores no fueron encontrados' }, { status: 400 })
    }

    // Sólo se reparten jugadores con puntaje: uno sin puntuar contaría como 0 y
    // desbalancearía los equipos.
    const ratedPlayers = players.filter(p => p.averageRating !== null)
    const unratedCount = players.length - ratedPlayers.length

    if (ratedPlayers.length < 4) {
      return NextResponse.json({
        error: unratedCount > 0
          ? `Se necesitan al menos 4 jugadores con puntaje (${unratedCount} seleccionado${unratedCount === 1 ? '' : 's'} aún no tiene${unratedCount === 1 ? '' : 'n'} puntaje)`
          : 'Se necesitan al menos 4 jugadores con puntaje para generar equipos'
      }, { status: 400 })
    }

    // Obtener incompatibilidades del grupo y armar los clusters obligados.
    const incompatibilities = await prisma.playerIncompatibility.findMany({
      where: { groupId },
      select: { player1Id: true, player2Id: true }
    })

    const clusters = buildClusters(ratedPlayers, incompatibilities)

    // Historial reciente para evitar repetir el mismo reparto (una sola query).
    const recentHistory = await prisma.teamHistory.findMany({
      where: { groupId },
      orderBy: { generatedAt: 'desc' },
      take: 20,
      select: { teamA: true, teamB: true }
    })

    let bestTeam: { teamA: PlayerWithRating[]; teamB: PlayerWithRating[] } | null = null
    let bestDiff = Infinity
    let fallbackTeam: { teamA: PlayerWithRating[]; teamB: PlayerWithRating[] } | null = null
    let fallbackDiff = Infinity

    const maxAttempts = 100

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const candidate = assignClusters(shuffle(clusters), ratedPlayers.length)
      const diff = calculateDiff(candidate.teamA, candidate.teamB)

      // Guardamos el mejor reparto absoluto como respaldo por si todos los
      // candidatos resultan duplicados del historial reciente.
      if (diff < fallbackDiff) {
        fallbackDiff = diff
        fallbackTeam = candidate
      }

      const isDuplicate = isRecentDuplicate(
        recentHistory,
        candidate.teamA.map(p => p.id),
        candidate.teamB.map(p => p.id)
      )

      if (!isDuplicate && diff < bestDiff) {
        bestDiff = diff
        bestTeam = candidate
        if (diff < 0.1) break
      }
    }

    // Si no hubo ningún reparto no-duplicado, usamos el mejor disponible.
    if (!bestTeam) {
      bestTeam = fallbackTeam
      bestDiff = fallbackDiff
    }

    if (!bestTeam) {
      return NextResponse.json({ error: 'No se pudieron generar equipos' }, { status: 500 })
    }

    const history = await prisma.teamHistory.create({
      data: {
        groupId,
        teamA: JSON.stringify(bestTeam.teamA.map(p => p.id)),
        teamB: JSON.stringify(bestTeam.teamB.map(p => p.id)),
        averageDiff: bestDiff
      }
    })

    return NextResponse.json({
      id: history.id,
      teamA: bestTeam.teamA,
      teamB: bestTeam.teamB,
      averageDiff: bestDiff,
      generatedAt: history.generatedAt
    })
  } catch (error) {
    console.error('Error generating teams:', error)
    return NextResponse.json({ error: 'Error al generar equipos' }, { status: 500 })
  }
}
