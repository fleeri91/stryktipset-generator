'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateRows, calculateCost } from '@/lib/bong'
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
  betPerRow: number
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
  betPerRow,
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

  function togglePick(matchIndex: number, key: keyof Picks) {
    setSelections((prev) => ({
      ...prev,
      [matchIndex]: {
        ...prev[matchIndex],
        [key]: !prev[matchIndex][key],
      },
    }))
  }

  const selectionsList = useMemo(
    () => matches.map((m) => selections[m.matchIndex]),
    [matches, selections]
  )

  const allHavePick = selectionsList.every((s) => s.home || s.draw || s.away)
  const rows = calculateRows(selectionsList)
  const cost = calculateCost(selectionsList, betPerRow)

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
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            {participantName}s bong
          </p>
        </div>

        {/* Match list */}
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
              const picks = selections[match.matchIndex]
              const hasPick = picks.home || picks.draw || picks.away
              return (
                <div
                  key={match.matchIndex}
                  className="border-border/50 flex items-center gap-3 border-b py-2.5 last:border-0"
                >
                  <span className="text-muted-foreground w-5 shrink-0 text-center text-xs">
                    {match.matchIndex}
                  </span>
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
                  <div className="flex gap-1.5">
                    {CHOICES.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => togglePick(match.matchIndex, key)}
                        className={`flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                          picks[key]
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Stats + submit */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rader</span>
              <span className="text-foreground font-medium">
                {rows.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kostnad</span>
              <span className="text-foreground font-medium">{cost} kr</span>
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
