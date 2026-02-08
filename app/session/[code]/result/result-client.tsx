'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { calculateRows } from '@/lib/bong'

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
  matches,
  combined,
  contributors,
  participantCount,
}: ResultClientProps) {
  const router = useRouter()

  const rows = calculateRows(combined)

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-lg space-y-6">
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
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-primary text-lg font-bold">
                {rows.toLocaleString()}
              </p>
              <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                Rader
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-primary text-lg font-bold">
                {Math.ceil(rows / participantCount)} kr
              </p>
              <p className="text-muted-foreground text-[10px] tracking-wider uppercase">
                Per person
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Combined bong table */}
        <Card>
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
                  <ToggleGroup
                    type="multiple"
                    value={
                      picks
                        ? CHOICES.filter(({ key }) => picks[key]).map(
                            ({ key }) => key
                          )
                        : []
                    }
                    disabled
                    className="pointer-events-none"
                  >
                    {CHOICES.map(({ key, label }) => {
                      const isSelected = picks?.[key] ?? false
                      const names = contributors[match.matchIndex]?.[key] ?? []
                      return (
                        <ToggleGroupItem
                          key={key}
                          value={key}
                          title={names.join(', ')}
                          className={`h-10 w-10 disabled:opacity-100 ${
                            isSelected
                              ? pickCountColor(selectedCount)
                              : 'text-muted-foreground border-transparent bg-transparent'
                          }`}
                        >
                          {label}
                        </ToggleGroupItem>
                      )
                    })}
                  </ToggleGroup>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
