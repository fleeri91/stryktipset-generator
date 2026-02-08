'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatKickoff } from '@/lib/matches'

const BET_AMOUNTS = [1, 2, 5, 10] as const

interface MatchFromApi {
  eventNumber: number
  homeTeam: string
  awayTeam: string
  league: string
  kickoff: string
  odds: { home: string; draw: string; away: string }
}

interface DrawInfo {
  drawNumber: number
  drawComment: string
  closeTime: string
  jackpot: string | null
  matches: MatchFromApi[]
}

export default function CreateSessionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [hostName, setHostName] = useState<string | null>(null)
  const [betPerRow, setBetPerRow] = useState<number>(1)
  const [draw, setDraw] = useState<DrawInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState('')

  // Read sessionStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = sessionStorage.getItem('hostName')
    if (!stored) {
      router.replace('/')
      return
    }
    setHostName(stored)
    fetchMatches()
  }, [router])

  async function fetchMatches() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/draws')
      if (!res.ok) throw new Error()
      const data: DrawInfo = await res.json()
      setDraw(data)
      setSelectedIds(new Set(data.matches.map((m) => m.eventNumber)))
    } catch {
      setError('Kunde inte hämta matcher. Försök igen.')
    } finally {
      setLoading(false)
    }
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
    if (!draw || !hostName || selectedIds.size === 0) return

    const selectedMatches = draw.matches
      .filter((m) => selectedIds.has(m.eventNumber))
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

  // Show nothing until we've checked sessionStorage on the client
  if (hostName === null) return null

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
              <div>
                <CardTitle className="text-sm">
                  {draw ? `Omgång ${draw.drawNumber}` : 'Matcher'}
                </CardTitle>
                {draw?.jackpot && (
                  <CardDescription className="mt-0.5">
                    Jackpot: {draw.jackpot} kr
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {draw && (
                  <span className="text-muted-foreground text-xs">
                    {selectedIds.size} valda
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={fetchMatches}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              </div>
            ) : draw ? (
              <div className="space-y-1.5">
                {draw.matches.map((match) => {
                  const selected = selectedIds.has(match.eventNumber)
                  return (
                    <button
                      key={match.eventNumber}
                      onClick={() => toggleMatch(match.eventNumber)}
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
                      <span className="text-muted-foreground w-5 shrink-0 text-center text-xs">
                        {match.eventNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            selected
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {match.homeTeam} — {match.awayTeam}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {match.league}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-muted-foreground text-[11px]">
                          {formatKickoff(match.kickoff)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Inga matcher tillgängliga just nu.
              </p>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          size="lg"
          className="w-full"
          disabled={selectedIds.size === 0 || isPending || loading}
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
