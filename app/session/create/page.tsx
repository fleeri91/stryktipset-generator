'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, RefreshCw, Calendar, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface MatchFromApi {
  eventNumber: number
  homeTeam: string
  awayTeam: string
  league: string
  kickoff: string
}

interface DrawInfo {
  drawNumber: number
  drawComment: string
  closeTime: string
  jackpot: string | null
  eventType: string
  productName: string
  matches: MatchFromApi[]
}

export default function CreateSessionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [hostName, setHostName] = useState<string | null>(null)
  const [draws, setDraws] = useState<DrawInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('hostName')
    if (!stored) {
      router.replace('/')
      return
    }
    setHostName(stored)
    fetchDraws()
  }, [router])

  async function fetchDraws() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/draws')
      if (!res.ok) throw new Error()
      const data: DrawInfo[] = await res.json()
      setDraws(data)
    } catch {
      setError('Kunde inte hämta omgångar. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectDraw(draw: DrawInfo) {
    if (!hostName) return

    setError('')
    startTransition(async () => {
      try {
        const matches = draw.matches.map(
          ({ homeTeam, awayTeam, league, kickoff }) => ({
            homeTeam,
            awayTeam,
            league,
            kickoff,
          })
        )

        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostName,
            eventType: draw.eventType,
            drawNumber: draw.drawNumber,
            closeTime: draw.closeTime,
            matches,
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

  function formatCloseTime(iso: string) {
    return new Date(iso).toLocaleString('sv-SE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

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

        <div>
          <h1 className="font-display text-foreground text-2xl font-bold tracking-wider uppercase">
            Välj Omgång
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Hej <span className="text-foreground font-medium">{hostName}</span>,
            välj vilken omgång du vill tippa.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : draws.length > 0 ? (
          <div className="space-y-3">
            {draws.map((draw) => (
              <Card
                key={`${draw.eventType}-${draw.drawNumber}`}
                className={`hover:border-primary/20 cursor-pointer transition-colors ${
                  isPending ? 'pointer-events-none opacity-50' : ''
                }`}
                onClick={() => handleSelectDraw(draw)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-display text-base tracking-wider uppercase">
                        {draw.productName}
                      </CardTitle>
                      <CardDescription className="mt-0.5">
                        Omgång {draw.drawNumber}
                        {draw.drawComment && ` · ${draw.drawComment}`}
                      </CardDescription>
                    </div>
                    {draw.jackpot && (
                      <div className="bg-primary/10 text-primary flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        <Trophy className="h-3 w-3" />
                        {draw.jackpot} kr
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>{draw.matches.length} matcher</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Stänger {formatCloseTime(draw.closeTime)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-sm">
                Inga omgångar tillgängliga just nu.
              </p>
            </CardContent>
          </Card>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDraws}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Uppdatera
          </Button>
        </div>
      </div>
    </div>
  )
}
