'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  firstChoice?: string | null
}

interface BetBuilderClientProps {
  sessionCode: string
  matches: MatchData[]
  existingSelections: Record<number, Picks>
  participantName: string
  isEditing: boolean
}

type PickKey = 'home' | 'draw' | 'away'

const CHOICES: { key: PickKey; label: string }[] = [
  { key: 'home', label: '1' },
  { key: 'draw', label: 'X' },
  { key: 'away', label: '2' },
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

  const [selections, setSelections] = useState<Record<number, PickKey[]>>(
    () => {
      const initial: Record<number, PickKey[]> = {}
      matches.forEach((m) => {
        const existing = existingSelections[m.matchIndex]
        if (existing) {
          const allPicks = CHOICES.map((c) => c.key).filter(
            (k) => existing[k]
          ) as PickKey[]
          const fc = existing.firstChoice as PickKey | null | undefined
          initial[m.matchIndex] =
            fc && allPicks.includes(fc)
              ? [fc, ...allPicks.filter((k) => k !== fc)]
              : allPicks
        } else {
          initial[m.matchIndex] = []
        }
      })
      return initial
    }
  )

  const selectionsList = useMemo(
    () =>
      matches.map((m) => {
        const arr = selections[m.matchIndex]
        return {
          home: arr.includes('home'),
          draw: arr.includes('draw'),
          away: arr.includes('away'),
        }
      }),
    [matches, selections]
  )

  const allHavePick = selectionsList.every((s) => s.home || s.draw || s.away)

  function togglePick(matchIndex: number, key: PickKey) {
    setSelections((prev) => {
      const current = prev[matchIndex]
      if (current.includes(key)) {
        return { ...prev, [matchIndex]: current.filter((k) => k !== key) }
      }
      if (current.length >= 2) return prev
      return { ...prev, [matchIndex]: [...current, key] }
    })
  }

  function handleSubmit() {
    if (!allHavePick) return

    setError('')
    startTransition(async () => {
      try {
        const payload = {
          selections: matches.map((m) => {
            const arr = selections[m.matchIndex]
            return {
              matchIndex: m.matchIndex,
              home: arr.includes('home'),
              draw: arr.includes('draw'),
              away: arr.includes('away'),
              firstChoice: arr[0],
            }
          }),
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
              const hasPick = picks.length > 0
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
                  <div className="flex gap-1">
                    {CHOICES.map(({ key, label }) => {
                      const pos = selections[match.matchIndex].indexOf(key)
                      const isPrimary = pos === 0
                      const isSecondary = pos === 1
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => togglePick(match.matchIndex, key)}
                          className={`h-10 w-10 rounded-md border text-sm font-medium transition-colors ${
                            isPrimary
                              ? 'bg-primary text-primary-foreground border-primary'
                              : isSecondary
                                ? 'bg-primary/20 text-primary border-primary/30'
                                : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Stats + submit */}
        <Card>
          <CardContent className="space-y-4">
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
