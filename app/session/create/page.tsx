'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getAvailableMatches, formatKickoff } from '@/lib/matches'

const BET_AMOUNTS = [1, 2, 5, 10] as const

function getHostName() {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('hostName') ?? ''
}

export default function CreateSessionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [hostName] = useState(getHostName)
  const [betPerRow, setBetPerRow] = useState<number>(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(getAvailableMatches().map((m) => m.id))
  )
  const [error, setError] = useState('')

  const matches = getAvailableMatches()

  if (!hostName) {
    router.replace('/')
    return null
  }

  function toggleMatch(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCreate() {
    if (selectedIds.size === 0) return

    const selectedMatches = matches
      .filter((m) => selectedIds.has(m.id))
      .map(({ homeTeam, awayTeam, league, kickoff }) => ({
        homeTeam,
        awayTeam,
        league,
        kickoff,
      }))

    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostName,
            betPerRow,
            matches: selectedMatches,
          }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Något gick fel. Försök igen.')
          return
        }

        const data = await res.json()
        sessionStorage.removeItem('hostName')
        router.push(`/session/${data.code}`)
      } catch {
        setError('Kunde inte skapa sessionen. Försök igen.')
      }
    })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        <Button
          variant="ghost"
          onClick={() => {
            sessionStorage.removeItem('hostName')
            router.push('/')
          }}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Tillbaka
        </Button>

        {/* Bet amount */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg tracking-wider uppercase">
              Ny Session
            </CardTitle>
            <CardDescription>
              Du skapar sessionen som{' '}
              <span className="text-foreground font-medium">{hostName}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Insats per rad (kr)</Label>
            <div className="grid grid-cols-4 gap-2">
              {BET_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={betPerRow === amount ? 'default' : 'outline'}
                  className="text-base"
                  onClick={() => setBetPerRow(amount)}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Match selection */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Matcher ({selectedIds.size} valda)
              </CardTitle>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() =>
                  setSelectedIds(new Set(matches.map((m) => m.id)))
                }
              >
                Välj alla
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {matches.map((match) => {
              const selected = selectedIds.has(match.id)
              return (
                <button
                  key={match.id}
                  onClick={() => toggleMatch(match.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? 'border-primary/15 bg-primary/5'
                      : 'bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}
                  >
                    {selected && (
                      <Check
                        className="text-primary-foreground h-3 w-3"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        selected ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {match.homeTeam} — {match.awayTeam}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      {match.league}
                    </p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {formatKickoff(match.kickoff)}
                  </span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          size="lg"
          className="w-full"
          disabled={selectedIds.size === 0 || isPending}
          onClick={handleCreate}
        >
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          {isPending
            ? 'Skapar...'
            : `Skapa Session (${selectedIds.size} matcher)`}
        </Button>
      </div>
    </div>
  )
}
