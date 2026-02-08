import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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
        },
      },
    },
  })

  if (!participant || participant.session.code !== code.toUpperCase()) {
    redirect('/')
  }

  if (participant.session.status === 'GENERATED') {
    redirect(`/session/${code}`)
  }

  const matches = participant.session.matches.map((m) => ({
    matchIndex: m.matchIndex,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    league: m.league,
    kickoff: m.kickoff.toISOString(),
  }))

  const existing = participant.selections.reduce(
    (acc, s) => {
      acc[s.matchIndex] = { home: s.home, draw: s.draw, away: s.away }
      return acc
    },
    {} as Record<number, { home: boolean; draw: boolean; away: boolean }>
  )

  return (
    <BetBuilderClient
      sessionCode={code}
      matches={matches}
      existingSelections={existing}
      participantName={participant.name}
      isEditing={participant.submitted}
    />
  )
}
