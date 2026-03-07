import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface PlayerWithRating {
  id: string
  name: string
  averageRating: number | null
}

interface IncompatibilityMap {
  [playerId: string]: {
    cannotFace: Set<string>
    mustTogether: Set<string>
  }
}

function buildIncompatibilityMap(incompatibilities: any[]): IncompatibilityMap {
  const map: IncompatibilityMap = {}

  incompatibilities.forEach(incompat => {
    const { player1Id, player2Id, type } = incompat

    if (!map[player1Id]) {
      map[player1Id] = { cannotFace: new Set(), mustTogether: new Set() }
    }
    if (!map[player2Id]) {
      map[player2Id] = { cannotFace: new Set(), mustTogether: new Set() }
    }

    if (type === 'CANNOT_FACE_EACH_OTHER') {
      map[player1Id].cannotFace.add(player2Id)
      map[player2Id].cannotFace.add(player1Id)
    } else if (type === 'MUST_BE_ON_SAME_TEAM') {
      map[player1Id].mustTogether.add(player2Id)
      map[player2Id].mustTogether.add(player1Id)
    }
  })

  return map
}

function isValidTeamAssignment(
  teamA: PlayerWithRating[],
  teamB: PlayerWithRating[],
  incompatibilityMap: IncompatibilityMap
): boolean {
  // Validar CANNOT_FACE_EACH_OTHER: no pueden estar en equipos diferentes
  for (const player of teamA) {
    if (incompatibilityMap[player.id]?.cannotFace) {
      for (const incompatibleId of incompatibilityMap[player.id].cannotFace) {
        if (teamB.some(p => p.id === incompatibleId)) {
          return false
        }
      }
    }
  }

  // Validar MUST_BE_ON_SAME_TEAM: deben estar en el mismo equipo
  for (const player of teamA) {
    if (incompatibilityMap[player.id]?.mustTogether) {
      for (const incompatibleId of incompatibilityMap[player.id].mustTogether) {
        if (!teamA.some(p => p.id === incompatibleId)) {
          return false
        }
      }
    }
  }

  for (const player of teamB) {
    if (incompatibilityMap[player.id]?.mustTogether) {
      for (const incompatibleId of incompatibilityMap[player.id].mustTogether) {
        if (!teamB.some(p => p.id === incompatibleId)) {
          return false
        }
      }
    }
  }

  return true
}

function partitionPlayers(
  players: PlayerWithRating[],
  targetSize: number
): { teamA: PlayerWithRating[]; teamB: PlayerWithRating[] } {
  const validPlayers = players.filter(p => p.averageRating !== null)
  
  if (validPlayers.length < 4) {
    return { teamA: [], teamB: [] }
  }

  const sortedPlayers = [...validPlayers].sort((a, b) => 
    (b.averageRating || 0) - (a.averageRating || 0)
  )

  const totalPlayers = sortedPlayers.length
  const teamSize = Math.floor(totalPlayers / 2)
  const remainder = totalPlayers % 2

  const teamA: PlayerWithRating[] = []
  const teamB: PlayerWithRating[] = []

  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i]
    const currentTeamASize = teamA.length
    const currentTeamBSize = teamB.length

    const targetTeamASize = teamSize + (remainder > 0 && currentTeamASize < teamSize + remainder ? 1 : 0)
    const targetTeamBSize = teamSize + (remainder > 0 && currentTeamBSize < teamSize + remainder ? 1 : 0)

    if (currentTeamASize < targetTeamASize && currentTeamBSize < targetTeamBSize) {
      const avgA = teamA.reduce((sum, p) => sum + (p.averageRating || 0), 0) / (teamA.length || 1)
      const avgB = teamB.reduce((sum, p) => sum + (p.averageRating || 0), 0) / (teamB.length || 1)

      if (avgA <= avgB) {
        teamA.push(player)
      } else {
        teamB.push(player)
      }
    } else if (currentTeamASize < targetTeamASize) {
      teamA.push(player)
    } else {
      teamB.push(player)
    }
  }

  return { teamA, teamB }
}

function calculateDiff(teamA: PlayerWithRating[], teamB: PlayerWithRating[]): number {
  if (teamA.length === 0 || teamB.length === 0) return Infinity
  
  const avgA = teamA.reduce((sum, p) => sum + (p.averageRating || 0), 0) / teamA.length
  const avgB = teamB.reduce((sum, p) => sum + (p.averageRating || 0), 0) / teamB.length
  
  return Math.abs(avgA - avgB)
}

async function hasRecentDuplicate(
  groupId: string,
  teamA: string[],
  teamB: string[]
): Promise<boolean> {
  const recentHistory = await prisma.teamHistory.findMany({
    where: { groupId },
    orderBy: { generatedAt: 'desc' },
    take: 20
  })

  const currentSetA = new Set(teamA)
  const currentSetB = new Set(teamB)

  for (const history of recentHistory) {
    const prevTeamA = JSON.parse(history.teamA) as string[]
    const prevTeamB = JSON.parse(history.teamB) as string[]

    const prevSetA = new Set(prevTeamA)
    const prevSetB = new Set(prevTeamB)

    const aMatches = teamA.every(id => prevSetA.has(id)) && teamA.length === prevTeamA.length
    const bMatches = teamB.every(id => prevSetB.has(id)) && teamB.length === prevTeamB.length

    if (aMatches && bMatches) {
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

     let bestTeam: { teamA: PlayerWithRating[]; teamB: PlayerWithRating[] } | null = null
     let bestDiff = Infinity

     const maxAttempts = 100
     let attempts = 0

     // Obtener incompatibilidades del grupo
     const incompatibilities = await prisma.playerIncompatibility.findMany({
       where: { groupId }
     })

     const incompatibilityMap = buildIncompatibilityMap(incompatibilities)

     while (attempts < maxAttempts) {
       const shuffled = [...players].sort(() => Math.random() - 0.5)
       const splitIndex = Math.floor(shuffled.length / 2)
       const candidateA = shuffled.slice(0, splitIndex)
       const candidateB = shuffled.slice(splitIndex)

       // Validar que no viole incompatibilidades
       if (!isValidTeamAssignment(candidateA, candidateB, incompatibilityMap)) {
         attempts++
         continue
       }

       const diff = calculateDiff(candidateA, candidateB)

       if (diff < bestDiff) {
         const teamAIds = candidateA.map(p => p.id)
         const teamBIds = candidateB.map(p => p.id)
         
         const hasDuplicate = await hasRecentDuplicate(groupId, teamAIds, teamBIds)
         
         if (!hasDuplicate || diff < 0.1) {
           bestDiff = diff
           bestTeam = { teamA: candidateA, teamB: candidateB }
           
           if (diff < 0.1) break
         }
       }

       attempts++
     }

    if (!bestTeam) {
      return NextResponse.json({ error: 'No se pudieron generar equipos únicos' }, { status: 500 })
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
