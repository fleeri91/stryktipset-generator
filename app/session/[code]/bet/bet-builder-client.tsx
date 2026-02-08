'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'
import { calculateRows } from '@/lib/bong'
import { formatKickoff } from '@/lib/matches'

interface MatchData {
  matchIndex: number
  homeTeam: string
  awayTeam: string
  league: string
  kickoff: string
}

interface Picks {
  home: boolean
  draw: boolean
  away: boolean
}

interface BetBuilderClientProps {
  sessionCode: string
  matches: MatchData[]
  existingSelections: Record<number, Picks>
  participantName: string
  isEditing: boolean
}

const CHOICES = [
  { key: 'home' as const, label: '1' },
  { key: 'draw' as const, label: 'X' },
  { key: 'away' as const, label: '2' },
]

export function BetBuilderClient({
  sessionCode,
  matches,
  existingSelections,
  participantName,
  isEditing,
}: BetBuilderClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [selections, setSelections] = useState<Record<number, Picks>>(() => {
    const initial: Record<number, Picks> = {}
    matches.forEach((m) => {
      initial[m.matchIndex] = existingSelections[m.matchIndex] ?? {
        home: false,
        draw: false,
        away: false,
      }
    })
    return initial
  })

  const selectionsList = useMemo(
    () => matches.map((m) => selections[m.matchIndex]),
    [matches, selections]
  )

  const allHavePick = selectionsList.every((s) => s.home || s.draw || s.away)
  const rows = calculateRows(selectionsList)

  function handleSubmit() {
    if (!allHavePick) return

    setError('')
    startTransition(async () => {
      try {
        const payload = {
          selections: matches.map((m) => ({
            matchIndex: m.matchIndex,
            ...selections[m.matchIndex],
          })),
        }

        const res = await fetch(`/api/sessions/${sessionCode}/selections`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Något gick fel.')
          return
        }

        router.push(`/session/${sessionCode}`)
        router.refresh()
      } catch {
        setError('Kunde inte spara bongen. Försök igen.')
      }
    })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/session/${sessionCode}`)}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Tillbaka
          </Button>
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            {participantName}s bong
          </p>
        </div>

        {/* Match list */}
        <Card>
          <CardContent className="space-y-1">
            {matches.map((match) => {
              const picks = selections[match.matchIndex]
              const hasPick = picks.home || picks.draw || picks.away
              return (
                <div
                  key={match.matchIndex}
                  className="border-border/50 flex items-center gap-3 border-b py-2.5 last:border-0"
                >
                  <Badge className="h-8 w-8 shrink-0 text-center text-sm font-bold">
                    {match.matchIndex}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        hasPick ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {match.homeTeam} — {match.awayTeam}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {match.league} · {formatKickoff(match.kickoff)}
                    </p>
                  </div>
                  <ToggleGroup
                    type="multiple"
                    value={Object.entries(picks)
                      .filter(([, v]) => v)
                      .map(([k]) => k)}
                    onValueChange={(values: string[]) => {
                      setSelections((prev) => ({
                        ...prev,
                        [match.matchIndex]: {
                          home: values.includes('home'),
                          draw: values.includes('draw'),
                          away: values.includes('away'),
                        },
                      }))
                    }}
                  >
                    {CHOICES.map(({ key, label }) => (
                      <ToggleGroupItem
                        key={key}
                        value={key}
                        className="h-10 w-10"
                      >
                        {label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Stats + submit */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rader</span>
              <span className="text-foreground font-medium">
                {rows.toLocaleString()}
              </span>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button
              size="lg"
              className="w-full"
              disabled={!allHavePick || isPending}
              onClick={handleSubmit}
            >
              {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isPending
                ? 'Sparar...'
                : isEditing
                  ? 'Uppdatera Bong'
                  : 'Skicka In Bong'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
