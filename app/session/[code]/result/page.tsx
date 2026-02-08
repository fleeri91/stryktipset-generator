import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { mergeSelections } from '@/lib/bong'
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
    }))
  )

  const combined = mergeSelections(allSelections)

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
      betPerRow={session.betPerRow}
      matches={matches}
      combined={combined}
      contributors={contributors}
      participants={participants}
      participantCount={participants.length}
    />
  )
}
