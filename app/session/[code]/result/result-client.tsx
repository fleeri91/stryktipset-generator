'use client'

import { useRouter } from 'next/navigation'
import { SessionShell } from '@/components/bongen/session-shell'
import { useToast } from '@/components/bongen/toast'
import {
  BigButton,
  ScreenFooter,
  ScreenHeader,
  TextButton,
} from '@/components/bongen/ui'
import {
  ROW_PRICE_KR,
  formatKr,
  formatNumber,
  productName,
  weekLabel,
} from '@/lib/session-labels'
import type { SessionSummary } from '@/lib/session-summary'
import { cn } from '@/lib/utils'

interface MatchData {
  matchIndex: number
  homeTeam: string
  awayTeam: string
}

interface CombinedPick {
  matchIndex: number
  home: boolean
  draw: boolean
  away: boolean
}

interface ResultClientProps {
  summary: SessionSummary
  matches: MatchData[]
  combined: CombinedPick[]
  rows: number
}

const CHOICES = [
  { key: 'home' as const, label: '1' },
  { key: 'draw' as const, label: 'X' },
  { key: 'away' as const, label: '2' },
]

export function ResultClient({
  summary,
  matches,
  combined,
  rows,
}: ResultClientProps) {
  const router = useRouter()
  const flash = useToast()

  const product = productName(summary.eventType)
  const week = weekLabel(summary.closesAt)
  const headCount = Math.max(summary.participants.length, 1)
  const totalCost = rows * ROW_PRICE_KR
  const perHead = Math.ceil(totalCost / headCount)

  const marksFor = (matchIndex: number) => {
    const picks = combined.find((c) => c.matchIndex === matchIndex)
    return CHOICES.filter(({ key }) => picks?.[key])
  }

  async function copyBong() {
    const lines = matches.map((m) => {
      const marks = marksFor(m.matchIndex)
        .map((c) => c.label)
        .join('')
      return `${String(m.matchIndex).padStart(2, ' ')}  ${m.homeTeam}–${m.awayTeam}  ${marks}`
    })
    const text = [
      `${product} ${week}`,
      ...lines,
      `${formatNumber(rows)} rader · ${formatKr(totalCost)}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      flash('Bongen kopierad')
    } catch {
      flash('Kunde inte kopiera')
    }
  }

  const paper = (
    <div className="bg-paper text-paper-fg rounded-[14px] px-[15px] pt-4 pb-[18px] lg:px-5 lg:pt-[18px] lg:pb-5">
      <div className="border-paper-fg flex items-baseline justify-between border-b-2 pb-2.5">
        <div className="font-mono text-xs font-semibold tracking-[0.14em] uppercase">
          {product}
        </div>
        <div className="font-mono text-xs">{week.toUpperCase()}</div>
      </div>
      {matches.map((m) => {
        const marks = marksFor(m.matchIndex).map((c) => c.key)
        return (
          <div
            key={m.matchIndex}
            className="border-paper-line flex items-center gap-2 border-b py-1.5 lg:gap-2.5"
          >
            <div className="text-paper-muted w-[13px] font-mono text-[10px] lg:w-[15px]">
              {m.matchIndex}
            </div>
            <div className="min-w-0 flex-1 truncate text-[13px] leading-[1.25] lg:text-sm">
              {m.homeTeam}–{m.awayTeam}
            </div>
            <div className="flex shrink-0 gap-[3px]">
              {CHOICES.map(({ key, label }) => (
                <div
                  key={key}
                  className={cn(
                    'flex h-[22px] w-[22px] items-center justify-center rounded-[5px] font-mono text-xs font-semibold',
                    marks.includes(key)
                      ? 'bg-paper-mark text-[oklch(0.98_0.005_80)]'
                      : 'text-[oklch(0.72_0.015_80)]'
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <div className="flex justify-between pt-3 font-mono text-[13px] font-semibold">
        <span>{formatNumber(rows)} RADER</span>
        <span>{formatKr(totalCost)}</span>
      </div>
    </div>
  )

  const perHeadCard = (
    <div className="border-line-2 flex shrink-0 items-center justify-between rounded-xl border px-4 py-[13px] lg:py-3.5">
      <span className="text-fg-2 text-[15px]">Per person ({headCount} st)</span>
      <span className="text-cost font-mono text-lg font-semibold">
        {formatKr(perHead)}
      </span>
    </div>
  )

  const copyButton = <BigButton onClick={copyBong}>Kopiera bongen</BigButton>

  const restartButton = (
    <TextButton onClick={() => router.push('/')}>NY OMGÅNG</TextButton>
  )

  return (
    <SessionShell summary={summary}>
      <div className="animate-fade-up flex min-h-0 flex-1 flex-col">
        <ScreenHeader
          back={`/session/${summary.code}`}
          title="Bongen"
          className="pb-3 lg:px-10 lg:pt-6 lg:pb-3.5"
        />

        <div className="scrollbar-none flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-4 pb-3.5 lg:px-10 lg:pb-7">
          <div className="flex w-full flex-col gap-3 lg:max-w-[440px]">
            {paper}
            {perHeadCard}
            <div className="hidden lg:block">{copyButton}</div>
            <div className="hidden justify-center pb-[3px] lg:flex">
              {restartButton}
            </div>
          </div>
        </div>
        <ScreenFooter className="pb-6 lg:hidden">
          {copyButton}
          {restartButton}
        </ScreenFooter>
      </div>
    </SessionShell>
  )
}
