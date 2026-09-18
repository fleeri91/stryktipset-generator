'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SessionShell } from '@/components/bongen/session-shell'
import { useToast } from '@/components/bongen/toast'
import {
  BigButton,
  ErrorText,
  LimitChip,
  ScreenFooter,
  ScreenHeader,
} from '@/components/bongen/ui'
import { usePollRefresh } from '@/components/bongen/use-session'
import type { SessionSummary } from '@/lib/session-summary'
import { cn } from '@/lib/utils'

interface MatchData {
  matchIndex: number
  homeTeam: string
  awayTeam: string
  /** Betting distribution per outcome in percent (1, X, 2), when available */
  streck: [string, string, string] | null
  /** Odds per outcome (1, X, 2), when available */
  odds: [string, string, string] | null
}

interface Picks {
  home: boolean
  draw: boolean
  away: boolean
  firstChoice?: string | null
}

interface BetBuilderClientProps {
  summary: SessionSummary
  matches: MatchData[]
  existingSelections: Record<number, Picks>
}

type PickKey = 'home' | 'draw' | 'away'

const CHOICES: { key: PickKey; label: string }[] = [
  { key: 'home', label: '1' },
  { key: 'draw', label: 'X' },
  { key: 'away', label: '2' },
]

export function BetBuilderClient({
  summary,
  matches,
  existingSelections,
}: BetBuilderClientProps) {
  const router = useRouter()
  const flash = useToast()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  usePollRefresh(summary.status === 'BETTING')

  const maxHalv = summary.halvgarderingar
  const maxHel = summary.helgarderingar
  const isEditing = summary.me.submitted
  const lobbyHref = `/session/${summary.code}`

  // Picks per match, ordered: index 0 is the primary pick
  const [selections, setSelections] = useState<Record<number, PickKey[]>>(
    () => {
      const initial: Record<number, PickKey[]> = {}
      matches.forEach((m) => {
        const existing = existingSelections[m.matchIndex]
        if (!existing) {
          initial[m.matchIndex] = []
          return
        }
        const all = CHOICES.map((c) => c.key).filter((k) => existing[k])
        const fc = existing.firstChoice as PickKey | null | undefined
        initial[m.matchIndex] =
          fc && all.includes(fc) ? [fc, ...all.filter((k) => k !== fc)] : all
      })
      return initial
    }
  )

  const { halv, hel, filled } = useMemo(() => {
    let halv = 0
    let hel = 0
    let filled = 0
    for (const m of matches) {
      const n = selections[m.matchIndex]?.length ?? 0
      if (n > 0) filled++
      if (n === 2) halv++
      if (n === 3) hel++
    }
    return { halv, hel, filled }
  }, [matches, selections])

  const complete = filled === matches.length

  function toggle(matchIndex: number, key: PickKey) {
    const current = selections[matchIndex] ?? []
    if (current.includes(key)) {
      setSelections({
        ...selections,
        [matchIndex]: current.filter((k) => k !== key),
      })
      return
    }
    const next = current.length + 1
    // Adding a 2nd mark turns this match into a halvgardering; a 3rd into a helgardering
    if (next === 2 && halv + 1 > maxHalv) {
      flash('Alla halvgarderingar är använda')
      return
    }
    if (next === 3 && hel + 1 > maxHel) {
      flash('Alla helgarderingar är använda')
      return
    }
    setSelections({ ...selections, [matchIndex]: [...current, key] })
  }

  function clearPicks() {
    const empty: Record<number, PickKey[]> = {}
    matches.forEach((m) => (empty[m.matchIndex] = []))
    setSelections(empty)
  }

  function handleSubmit() {
    if (!complete || isPending) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sessions/${summary.code}/selections`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(
            res.status === 403
              ? 'Omgången är låst. Bongen har redan genererats.'
              : data.error || 'Kunde inte spara tipset. Försök igen.'
          )
          return
        }
        flash(isEditing ? 'Ändringar sparade' : 'Tipset inskickat')
        router.push(lobbyHref)
        router.refresh()
      } catch {
        setError('Kunde inte spara tipset. Försök igen.')
      }
    })
  }

  const submitLabel = complete
    ? isEditing
      ? 'Spara ändringar'
      : 'Skicka in tipset'
    : `Tippa alla ${matches.length} (${filled}/${matches.length})`

  const chips = (
    <>
      <LimitChip over={halv > maxHalv}>
        {halv}/{maxHalv} halv
      </LimitChip>
      <LimitChip over={hel > maxHel}>
        {hel}/{maxHel} hel
      </LimitChip>
    </>
  )

  const clearButton = (
    <button
      type="button"
      onClick={clearPicks}
      className="border-line-3 text-fg-2 hover:border-fg-4 cursor-pointer rounded-lg border bg-transparent px-2.5 py-1.5 font-mono text-[10px] tracking-[0.1em] transition-colors lg:px-[11px] lg:py-[7px]"
    >
      RENSA
    </button>
  )

  return (
    <SessionShell summary={summary}>
      <div className="border-line border-b">
        <ScreenHeader
          back={lobbyHref}
          title="Ditt tips"
          className="px-[18px] pb-2.5 lg:px-10 lg:pb-4"
          right={
            <>
              <div className="hidden gap-[7px] lg:flex">{chips}</div>
              {clearButton}
            </>
          }
        />
        <div className="flex gap-[7px] px-[18px] pb-2.5 lg:hidden">{chips}</div>
      </div>

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-3 pt-0.5 pb-2 lg:px-10 lg:pt-2 lg:pb-3">
        <div className="w-full lg:max-w-[440px]">
          {matches.map((m) => {
            const sel = selections[m.matchIndex] ?? []
            return (
              <div
                key={m.matchIndex}
                className="border-line flex items-center gap-[9px] border-b px-[5px] py-[5px] lg:gap-3 lg:px-0.5 lg:py-1.5"
              >
                <div className="text-fg-4 w-3.5 shrink-0 text-right font-mono text-[11px] lg:w-4">
                  {m.matchIndex}
                </div>
                <div className="min-w-0 flex-1 truncate text-sm leading-[1.3] font-semibold">
                  {m.homeTeam} – {m.awayTeam}
                </div>
                <div className="flex shrink-0 items-start gap-[5px]">
                  {CHOICES.map(({ key, label }, ki) => {
                    const pos = sel.indexOf(key)
                    const on = pos >= 0
                    const primary = pos === 0
                    return (
                      <div
                        key={key}
                        className="flex flex-col items-center gap-[3px]"
                      >
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(m.matchIndex, key)}
                          className={cn(
                            'flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-0 font-mono text-[15px] font-semibold transition-colors duration-[120ms] select-none',
                            primary
                              ? 'bg-ember text-ember-fg'
                              : on
                                ? 'bg-ember-soft text-warn-fg'
                                : 'text-fg-4 hover:text-fg-2 bg-[oklch(0.225_0.01_60)]'
                          )}
                        >
                          {label}
                        </button>
                        {m.streck && (
                          <div className="text-fg-3 text-center font-mono text-[9.5px] leading-none tracking-[0.02em]">
                            {m.streck[ki]}%
                          </div>
                        )}
                        {m.odds && (
                          <div className="text-fg-3 text-center font-mono text-[9.5px] leading-none tracking-[0.02em]">
                            {m.odds[ki]}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ScreenFooter className="px-5 pt-[11px] pb-6 lg:flex-row lg:justify-center lg:px-10 lg:pt-3.5 lg:pb-[22px]">
        <div className="w-full lg:max-w-[440px]">
          <ErrorText>{error}</ErrorText>
          <BigButton
            className={error ? 'mt-2' : ''}
            variant={complete ? 'primary' : 'muted'}
            disabled={!complete || isPending}
            onClick={handleSubmit}
          >
            {isPending ? 'Sparar…' : submitLabel}
          </BigButton>
        </div>
      </ScreenFooter>
    </SessionShell>
  )
}
