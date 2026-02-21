'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Users, Crown, Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Participant {
  id: string
  name: string
  isHost: boolean
  submitted: boolean
}

interface LobbyClientProps {
  sessionCode: string
  status: string
  participants: Participant[]
  currentParticipantId: string
}

const POLL_INTERVAL_MS = 3000

export function LobbyClient({
  sessionCode,
  status,
  participants,
  currentParticipantId,
}: LobbyClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [isLeavePending, setLeavePending] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const currentParticipant = participants.find(
    (p) => p.id === currentParticipantId
  )
  const isCurrentParticipantHost = currentParticipant?.isHost ?? false

  useEffect(() => {
    if (status === 'GENERATED') return

    const intervalId = setInterval(() => {
      router.refresh()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [status, sessionCode, router])

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(sessionCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  function handleGenerate() {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionCode}/generate`, {
          method: 'POST',
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Något gick fel.')
          return
        }

        router.push(`/session/${sessionCode}/result`)
        router.refresh()
      } catch {
        setError('Kunde inte generera bongen. Försök igen.')
      }
    })
  }

  function handleLeaveClick() {
    if (!confirmLeave) {
      setConfirmLeave(true)
      setTimeout(() => setConfirmLeave(false), 3000)
      return
    }
    setLeavePending(true)
    fetch(`/api/sessions/${sessionCode}/leave`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error()
        router.push('/')
      })
      .catch(() => {
        setError('Kunde inte lämna sessionen. Försök igen.')
        setLeavePending(false)
        setConfirmLeave(false)
      })
  }

  function handleCancelClick() {
    if (!confirmCancel) {
      setConfirmCancel(true)
      setTimeout(() => setConfirmCancel(false), 3000)
      return
    }
    fetch(`/api/sessions/${sessionCode}/cancel`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error()
        router.push('/')
      })
      .catch(() => {
        setError('Kunde inte avbryta sessionen. Försök igen.')
        setConfirmCancel(false)
      })
  }

  const allSubmitted = participants.every((p) => p.submitted)

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Session header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary text-xs tracking-[3px] uppercase">
              Session
            </p>
            <h1 className="font-display text-foreground text-3xl font-bold tracking-wider uppercase">
              Stryktipset
            </h1>
          </div>
          <Button
            variant={confirmLeave ? 'destructive' : 'ghost'}
            size="sm"
            disabled={isLeavePending}
            onClick={handleLeaveClick}
          >
            {confirmLeave ? 'Säker?' : 'Lämna'}
          </Button>
        </div>

        {/* Session code */}
        <Card
          className="hover:border-primary/20 cursor-pointer transition-colors"
          onClick={copyCode}
        >
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-muted-foreground text-[10px] tracking-widest uppercase">
                Sessionskod
              </p>
              <p className="text-primary mt-1 font-mono text-2xl font-bold tracking-[6px]">
                {sessionCode}
              </p>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5">
              {copied ? (
                <>
                  <Check className="text-primary h-4 w-4" />
                  <span className="text-primary text-xs">Kopierad!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">Kopiera</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Deltagare ({participants.length})
                {status === 'BETTING' && (
                  <span className="ml-1 flex items-center gap-1">
                    <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                    <span className="text-muted-foreground text-[10px] font-normal tracking-wider uppercase">
                      Live
                    </span>
                  </span>
                )}
              </CardTitle>
              {allSubmitted && (
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] tracking-widest uppercase">
                  Alla klara
                </span>
              )}
            </div>
            <CardDescription>
              Dela sessionskoden med dina vänner så de kan gå med.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {participants.map((p) => {
              const isMe = p.id === currentParticipantId
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    isMe ? 'border-primary/15 bg-primary/5' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">
                      {p.name}
                      {isMe && (
                        <span className="text-muted-foreground ml-1 text-xs font-normal">
                          (du)
                        </span>
                      )}
                      {p.isHost && (
                        <Crown className="text-primary ml-1.5 inline h-3.5 w-3.5" />
                      )}
                    </p>
                    <p
                      className={`text-xs ${
                        p.submitted ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {p.submitted ? 'Bong inskickad ✓' : 'Väntar...'}
                    </p>
                  </div>
                  {isMe && (status === 'BETTING' || status === 'GENERATED') && (
                    <Button
                      variant={p.submitted ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => router.push(`/session/${sessionCode}/bet`)}
                    >
                      {p.submitted ? 'Ändra' : 'Tippa'}
                    </Button>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {/* Action area */}
        {status === 'GENERATED' ? (
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push(`/session/${sessionCode}/result`)}
            >
              <Trophy className="mr-1.5 h-4 w-4" />
              Visa Kombinerad Bong
            </Button>
            {isCurrentParticipantHost && (
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                disabled={isPending}
                onClick={handleGenerate}
              >
                {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {isPending ? 'Genererar...' : 'Generera ny Kombinerad Bong'}
              </Button>
            )}
          </div>
        ) : allSubmitted ? (
          <Button
            size="lg"
            className="w-full"
            disabled={isPending}
            onClick={handleGenerate}
          >
            {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {isPending ? 'Genererar...' : 'Generera Kombinerad Bong'}
          </Button>
        ) : (
          <div className="text-muted-foreground border-border rounded-lg border border-dashed p-4 text-center text-xs">
            Väntar på att alla skickar in sina bongar...
          </div>
        )}

        {/* Cancel session — host only, BETTING status only */}
        {status === 'BETTING' && isCurrentParticipantHost && (
          <div className="flex justify-center pt-2">
            <button
              className="text-muted-foreground/50 hover:text-destructive text-xs transition-colors"
              onClick={handleCancelClick}
            >
              {confirmCancel
                ? 'Avbryt session? Tryck igen'
                : 'Avbryt session'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
