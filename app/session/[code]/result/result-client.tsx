'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Crown, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { calculateRows, calculateCost } from '@/lib/bong'

interface MatchData {
  matchIndex: number
  homeTeam: string
  awayTeam: string
  league: string
}

interface CombinedPick {
  matchIndex: number
  home: boolean
  draw: boolean
  away: boolean
}

interface Participant {
  id: string
  name: string
  isHost: boolean
}

interface ResultClientProps {
  sessionCode: string
  betPerRow: number
  matches: MatchData[]
  combined: CombinedPick[]
  contributors: Record<
    number,
    { home: string[]; draw: string[]; away: string[] }
  >
  participants: Participant[]
  participantCount: number
}

const CHOICES = [
  { key: 'home' as const, label: '1' },
  { key: 'draw' as const, label: 'X' },
  { key: 'away' as const, label: '2' },
]

function pickCountColor(count: number) {
  if (count >= 3)
    return 'bg-destructive/15 text-destructive border-destructive/20'
  if (count === 2)
    return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20'
  return 'bg-primary/15 text-primary border-primary/20'
}

export function ResultClient({
  sessionCode,
  betPerRow,
  matches,
  combined,
  contributors,
  participants,
  participantCount,
}: ResultClientProps) {
  const router = useRouter()

  const rows = calculateRows(combined)
  const totalCost = calculateCost(combined, betPerRow)
  const costPerPerson = Math.ceil(totalCost / participantCount)

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/session/${sessionCode}`)}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Tillbaka
          </Button>
        </div>

        {/* Title */}
        <div className="text-center">
          <Trophy className="text-primary mx-auto mb-2 h-8 w-8" />
          <h1 className="font-display text-foreground text-2xl font-bold tracking-wider uppercase">
            Kombinerad Bong
          </h1>
          <p className="text-muted-foreground mt-1 text-xs tracking-wider uppercase">
            {participantCount} deltagare · {rows.toLocaleString()} rader
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Rader', value: rows.toLocaleString() },
            { label: 'Per rad', value: `${betPerRow} kr` },
            { label: 'Totalt', value: `${totalCost} kr` },
            { label: 'Per person', value: `${costPerPerson} kr` },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 text-center">
                <p className="text-primary text-lg font-bold">{stat.value}</p>
                <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                  {stat.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Combined bong table */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Matcher</CardTitle>
              <div className="text-muted-foreground flex gap-4 text-[10px] tracking-widest uppercase">
                <span className="w-10 text-center">1</span>
                <span className="w-10 text-center">X</span>
                <span className="w-10 text-center">2</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {matches.map((match) => {
              const picks = combined.find(
                (c) => c.matchIndex === match.matchIndex
              )
              const selectedCount = picks
                ? [picks.home, picks.draw, picks.away].filter(Boolean).length
                : 0

              return (
                <div
                  key={match.matchIndex}
                  className="border-border/50 flex items-center gap-3 border-b py-2.5 last:border-0"
                >
                  <span className="text-muted-foreground w-5 shrink-0 text-center text-xs">
                    {match.matchIndex}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate text-sm">
                      {match.homeTeam} — {match.awayTeam}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {match.league}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {CHOICES.map(({ key, label }) => {
                      const isSelected = picks?.[key] ?? false
                      const names = contributors[match.matchIndex]?.[key] ?? []
                      return (
                        <div
                          key={key}
                          title={names.join(', ')}
                          className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium ${
                            isSelected
                              ? pickCountColor(selectedCount)
                              : 'text-muted-foreground/20 border-transparent'
                          }`}
                        >
                          {isSelected ? label : ''}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Color legend */}
        <div className="flex justify-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="bg-primary/15 border-primary/20 h-3 w-3 rounded border" />
            <span className="text-muted-foreground">1 val</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded border border-yellow-500/20 bg-yellow-500/15" />
            <span className="text-muted-foreground">2 val</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="bg-destructive/15 border-destructive/20 h-3 w-3 rounded border" />
            <span className="text-muted-foreground">3 val</span>
          </div>
        </div>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Deltagare</CardTitle>
            <CardDescription>
              Håll över en markering för att se vem som tippade vad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="bg-muted flex items-center gap-1.5 rounded-md px-3 py-1.5"
                >
                  <span className="text-foreground text-sm">{p.name}</span>
                  {p.isHost && <Crown className="text-primary h-3 w-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
