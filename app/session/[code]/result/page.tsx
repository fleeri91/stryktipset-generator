import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { mergeSelections, trimToMaxRows, generateSystemBong } from '@/lib/bong'
import { ResultClient } from './result-client'

interface Props {
  params: Promise<{ code: string }>
}

export default async function ResultPage({ params }: Props) {
  const { code } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('participant-token')?.value

  if (!token) redirect('/')

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: {
      session: {
        include: {
          matches: { orderBy: { matchIndex: 'asc' } },
          participants: {
            include: {
              selections: { orderBy: { matchIndex: 'asc' } },
            },
            orderBy: { isHost: 'desc' },
          },
        },
      },
    },
  })

  if (!participant || participant.session.code !== code.toUpperCase()) {
    redirect('/')
  }

  if (participant.session.status !== 'GENERATED') {
    redirect(`/session/${code}`)
  }

  const session = participant.session

  const matches = session.matches.map((m) => ({
    matchIndex: m.matchIndex,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    league: m.league,
  }))

  const allSelections = session.participants.map((p) =>
    p.selections.map((s) => ({
      matchIndex: s.matchIndex,
      home: s.home,
      draw: s.draw,
      away: s.away,
      firstChoice: s.firstChoice,
    }))
  )

  const matchIndices = matches.map((m) => m.matchIndex)

  let combined: { matchIndex: number; home: boolean; draw: boolean; away: boolean }[]

  if (
    session.halvgarderingar !== null &&
    session.helgarderingar !== null
  ) {
    // New algorithm: generate system bong with exact halvgardering/helgardering counts
    combined = generateSystemBong(
      allSelections,
      matchIndices,
      session.halvgarderingar,
      session.helgarderingar
    )
  } else {
    // Legacy: merge by primary picks, optionally trim to maxRows budget
    const merged = mergeSelections(allSelections)
    const primaryCounts: Record<number, { home: number; draw: number; away: number }> = {}
    for (const { matchIndex } of matches) {
      primaryCounts[matchIndex] = { home: 0, draw: 0, away: 0 }
    }
    for (const p of session.participants) {
      for (const s of p.selections) {
        const fc = s.firstChoice
        if (fc === 'home' || fc === 'draw' || fc === 'away') {
          primaryCounts[s.matchIndex][fc]++
        } else {
          if (s.home) primaryCounts[s.matchIndex].home++
          if (s.draw) primaryCounts[s.matchIndex].draw++
          if (s.away) primaryCounts[s.matchIndex].away++
        }
      }
    }
    const maxRows = session.maxRows
    combined = maxRows !== null ? trimToMaxRows(merged, maxRows, primaryCounts) : merged
  }

  // Track who picked what per match
  const contributors: Record<
    number,
    { home: string[]; draw: string[]; away: string[] }
  > = {}
  for (const match of matches) {
    contributors[match.matchIndex] = { home: [], draw: [], away: [] }
  }
  for (const p of session.participants) {
    for (const s of p.selections) {
      if (s.home) contributors[s.matchIndex].home.push(p.name)
      if (s.draw) contributors[s.matchIndex].draw.push(p.name)
      if (s.away) contributors[s.matchIndex].away.push(p.name)
    }
  }

  const participants = session.participants.map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
  }))

  return (
    <ResultClient
      sessionCode={code}
      matches={matches}
      combined={combined}
      contributors={contributors}
      participants={participants}
      participantCount={participants.length}
    />
  )
}
