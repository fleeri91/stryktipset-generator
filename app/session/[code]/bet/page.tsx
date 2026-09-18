import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { fetchMatchInfo } from '@/lib/api'
import { toSessionSummary } from '@/lib/session-summary'
import { BetBuilderClient } from './bet-builder-client'

interface Props {
  params: Promise<{ code: string }>
}

export default async function BetPage({ params }: Props) {
  const { code } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('participant-token')?.value

  if (!token) redirect('/')

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: {
      selections: { orderBy: { matchIndex: 'asc' } },
      session: {
        include: {
          matches: { orderBy: { matchIndex: 'asc' } },
          participants: {
            select: { id: true, name: true, isHost: true, submitted: true },
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  })

  if (!participant || participant.session.code !== code.toUpperCase()) {
    redirect('/')
  }

  // Picks are locked once the bong is generated
  if (participant.session.status === 'GENERATED') {
    redirect(`/session/${code}`)
  }

  const matchInfo = await fetchMatchInfo(
    participant.session.eventType,
    participant.session.drawNumber
  )

  const matches = participant.session.matches.map((m) => ({
    matchIndex: m.matchIndex,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    streck: matchInfo?.[m.matchIndex]?.streck ?? null,
    odds: matchInfo?.[m.matchIndex]?.odds ?? null,
  }))

  const existing = participant.selections.reduce(
    (acc, s) => {
      acc[s.matchIndex] = {
        home: s.home,
        draw: s.draw,
        away: s.away,
        firstChoice: s.firstChoice,
      }
      return acc
    },
    {} as Record<
      number,
      {
        home: boolean
        draw: boolean
        away: boolean
        firstChoice: string | null
      }
    >
  )

  return (
    <BetBuilderClient
      summary={toSessionSummary(participant.session, participant)}
      matches={matches}
      existingSelections={existing}
    />
  )
}
