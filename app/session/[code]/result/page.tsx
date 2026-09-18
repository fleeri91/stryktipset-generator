import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  mergeSelections,
  trimToMaxRows,
  generateSystemBong,
  buildPrimaryCounts,
  calculateRows,
} from '@/lib/bong'
import { toSessionSummary } from '@/lib/session-summary'
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
            orderBy: { id: 'asc' },
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

  let combined: {
    matchIndex: number
    home: boolean
    draw: boolean
    away: boolean
  }[]

  if (session.halvgarderingar !== null && session.helgarderingar !== null) {
    // System bong with exact halvgardering/helgardering counts
    combined = generateSystemBong(
      allSelections,
      matchIndices,
      session.halvgarderingar,
      session.helgarderingar
    )
  } else {
    // Legacy: merge by primary picks, optionally trim to maxRows budget
    const merged = mergeSelections(allSelections)
    const primaryCounts = buildPrimaryCounts(allSelections, matchIndices)
    const maxRows = session.maxRows
    combined =
      maxRows !== null ? trimToMaxRows(merged, maxRows, primaryCounts) : merged
  }

  return (
    <ResultClient
      summary={toSessionSummary(session, participant)}
      matches={matches}
      combined={combined}
      rows={calculateRows(combined)}
    />
  )
}
