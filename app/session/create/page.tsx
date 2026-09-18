'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  BigButton,
  ErrorText,
  FieldLabel,
  Kicker,
  ScreenFooter,
  ScreenHeader,
  StepButton,
  TextInput,
} from '@/components/bongen/ui'
import {
  ROW_PRICE_KR,
  drawLabel,
  formatCloseTime,
  formatKr,
  formatNumber,
  productName,
  rowsFor,
} from '@/lib/session-labels'
import { cn } from '@/lib/utils'

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

const PRODUCTS = ['stryktipset', 'europatipset'] as const

/** The API sometimes returns a formatted string ("ca 5 milj kr"), sometimes a bare number. */
function formatJackpot(jackpot: string | null): string {
  if (!jackpot) return '–'
  return /kr/i.test(jackpot) ? jackpot : `${jackpot} kr`
}

export default function CreateSessionPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [draws, setDraws] = useState<DrawInfo[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [eventType, setEventType] = useState<string>(PRODUCTS[0])
  const [hostName, setHostName] = useState('')
  const [halv, setHalv] = useState(3)
  const [hel, setHel] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/draws')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: DrawInfo[]) => {
        if (cancelled) return
        setDraws(data)
        if (!data.some((d) => d.eventType === PRODUCTS[0]) && data[0]) {
          setEventType(data[0].eventType)
        }
      })
      .catch(() => !cancelled && setLoadError(true))
    return () => {
      cancelled = true
    }
  }, [])

  const draw = draws?.find((d) => d.eventType === eventType) ?? null
  const matchCount = draw?.matches.length ?? 13
  const rows = rowsFor(halv, hel)
  const canCreate = !!draw && hostName.trim().length > 0 && !isPending

  function pickProduct(next: string) {
    if (next === eventType) return
    setEventType(next)
    setError(null)
  }

  function handleCreate() {
    if (!draw || !canCreate) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostName: hostName.trim(),
            eventType: draw.eventType,
            drawNumber: draw.drawNumber,
            closeTime: draw.closeTime,
            matches: draw.matches.map(
              ({ homeTeam, awayTeam, league, kickoff }) => ({
                homeTeam,
                awayTeam,
                league,
                kickoff,
              })
            ),
            halvgarderingar: halv,
            helgarderingar: hel,
          }),
        })
        if (!res.ok) {
          setError('Kunde inte skapa omgången. Försök igen.')
          return
        }
        const data = await res.json()
        router.push(`/session/${data.code}`)
      } catch {
        setError('Kunde inte skapa omgången. Försök igen.')
      }
    })
  }

  const tabs = (
    <div className="bg-ink-3 mb-[18px] flex gap-1.5 rounded-xl p-1">
      {PRODUCTS.map((p) => {
        const available = !draws || draws.some((d) => d.eventType === p)
        const on = p === eventType
        return (
          <button
            key={p}
            type="button"
            disabled={!available}
            onClick={() => pickProduct(p)}
            className={cn(
              'h-[38px] flex-1 cursor-pointer rounded-[9px] border-0 font-sans text-[15px] font-semibold transition-colors disabled:cursor-default disabled:opacity-40',
              on
                ? 'bg-fg text-[oklch(0.20_0.015_60)]'
                : 'text-fg-3 bg-transparent'
            )}
          >
            {productName(p)}
          </button>
        )
      })}
    </div>
  )

  const drawCard = (
    <div className="border-line-2 flex flex-col gap-2.5 rounded-[14px] border px-[17px] py-[15px] lg:gap-3 lg:px-5 lg:py-[18px]">
      {draws === null && !loadError ? (
        <div className="text-fg-3 py-2 font-mono text-[11px] tracking-[0.16em]">
          HÄMTAR OMGÅNGAR…
        </div>
      ) : loadError ? (
        <div className="text-ember-text font-mono text-[11px]">
          Kunde inte hämta omgångar.{' '}
          <button
            type="button"
            className="cursor-pointer underline"
            onClick={() => router.refresh()}
          >
            Försök igen
          </button>
        </div>
      ) : !draw ? (
        <div className="text-fg-3 text-sm">
          Ingen öppen omgång för {productName(eventType)} just nu.
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span className="text-[17px] font-semibold lg:text-[19px]">
              {drawLabel(draw.eventType, draw.closeTime)}
            </span>
            <span className="text-fg-3 font-mono text-[11px]">
              {draw.matches.length} MATCHER
            </span>
          </div>
          <div className="border-line-2 flex items-baseline justify-between border-t border-dashed pt-2.5 text-sm lg:pt-3">
            <span className="text-fg-2">Stänger</span>
            <span className="font-mono">{formatCloseTime(draw.closeTime)}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-fg-2">Jackpot</span>
            <span className="text-gold font-mono">
              {formatJackpot(draw.jackpot)}
            </span>
          </div>
        </>
      )}
    </div>
  )

  const nameField = (
    <div className="mt-[22px]">
      <FieldLabel htmlFor="host-name">Ditt namn</FieldLabel>
      <TextInput
        id="host-name"
        value={hostName}
        maxLength={20}
        placeholder="Erik"
        onChange={(e) => setHostName(e.target.value)}
      />
    </div>
  )

  const steppers = (
    <>
      <Kicker className="mb-3">Systemets storlek</Kicker>
      <div className="flex flex-col gap-2.5">
        <StepperRow
          title="Halvgarderingar"
          subtitle="Två tecken på matchen"
          value={halv}
          onDec={() => setHalv((h) => Math.max(0, h - 1))}
          onInc={() => setHalv((h) => Math.min(matchCount - hel, h + 1))}
          canInc={halv + hel < matchCount}
        />
        <StepperRow
          title="Helgarderingar"
          subtitle="Alla tre tecken"
          value={hel}
          onDec={() => setHel((h) => Math.max(0, h - 1))}
          onInc={() => setHel((h) => Math.min(matchCount - halv, h + 1))}
          canInc={halv + hel < matchCount}
        />
      </div>
      <div className="bg-ink-3 mt-[18px] flex items-end justify-between rounded-[14px] p-[17px] lg:mt-4 lg:p-[18px]">
        <div>
          <div className="text-fg-3 mb-1.5 font-mono text-[11px] tracking-[0.16em]">
            RADER
          </div>
          <div className="font-mono text-[29px] leading-none font-semibold lg:text-[30px]">
            {formatNumber(rows)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-fg-3 mb-1.5 font-mono text-[11px] tracking-[0.16em]">
            KOSTNAD
          </div>
          <div className="text-cost font-mono text-[29px] leading-none font-semibold lg:text-[30px]">
            {formatKr(rows * ROW_PRICE_KR)}
          </div>
        </div>
      </div>
    </>
  )

  const submit = (
    <BigButton
      className="h-[54px]"
      variant={canCreate ? 'primary' : 'muted'}
      disabled={!canCreate}
      onClick={handleCreate}
    >
      {isPending ? 'Skapar…' : 'Skapa och dela kod'}
    </BigButton>
  )

  return (
    <div className="animate-fade-up flex h-dvh flex-col">
      <ScreenHeader back="/" title="Ny omgång" />

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-[22px] pb-5 lg:px-11 lg:pb-7">
        <div className="w-full lg:max-w-[440px]">
          {tabs}
          {drawCard}
          {nameField}
          <div className="mt-[22px]">{steppers}</div>
          <div className="mt-4 hidden lg:block">{submit}</div>
          <ErrorText>{error}</ErrorText>
        </div>
      </div>
      <ScreenFooter className="lg:hidden">{submit}</ScreenFooter>
    </div>
  )
}

function StepperRow({
  title,
  subtitle,
  value,
  onDec,
  onInc,
  canInc,
}: {
  title: string
  subtitle: string
  value: number
  onDec: () => void
  onInc: () => void
  canInc: boolean
}) {
  return (
    <div className="border-line-2 flex items-center justify-between gap-3 rounded-[14px] border px-[15px] py-[13px]">
      <div className="min-w-0">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-fg-3 text-[13px]">{subtitle}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <StepButton
          onClick={onDec}
          disabled={value === 0}
          aria-label={`Färre ${title.toLowerCase()}`}
        >
          −
        </StepButton>
        <span className="w-7 text-center font-mono text-[19px] font-semibold">
          {value}
        </span>
        <StepButton
          onClick={onInc}
          disabled={!canInc}
          aria-label={`Fler ${title.toLowerCase()}`}
        >
          +
        </StepButton>
      </div>
    </div>
  )
}
