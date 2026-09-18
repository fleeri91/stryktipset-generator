'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { SessionShell } from '@/components/bongen/session-shell'
import {
  BigButton,
  CodeCard,
  ErrorText,
  Kicker,
  ParticipantRow,
  ScreenFooter,
  TextButton,
} from '@/components/bongen/ui'
import {
  useCopyCode,
  useEndSession,
  usePollRefresh,
} from '@/components/bongen/use-session'
import {
  drawLabelUpper,
  formatNumber,
  rowsFor,
  systemLine,
} from '@/lib/session-labels'
import type { SessionSummary } from '@/lib/session-summary'

export function LobbyClient({ summary }: { summary: SessionSummary }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const copyCode = useCopyCode(summary.code)
  const end = useEndSession(summary)

  const open = summary.status === 'BETTING'
  usePollRefresh(open)

  const { participants, me, code } = summary
  const submittedCount = participants.filter((p) => p.submitted).length
  const waitingFor = participants.length - submittedCount
  const allIn = waitingFor === 0
  const rows = rowsFor(summary.halvgarderingar, summary.helgarderingar)

  function handleGenerate() {
    if (!allIn || isPending) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sessions/${code}/generate`, {
          method: 'POST',
        })
        if (!res.ok) {
          setError('Kunde inte generera bongen. Försök igen.')
          return
        }
        router.push(`/session/${code}/result`)
        router.refresh()
      } catch {
        setError('Kunde inte generera bongen. Försök igen.')
      }
    })
  }

  const goBuilder = () => router.push(`/session/${code}/bet`)
  const goResult = () => router.push(`/session/${code}/result`)

  const myPickButton = (
    <BigButton variant={me.submitted ? 'ghost' : 'primary'} onClick={goBuilder}>
      {me.submitted ? 'Ändra ditt tips' : 'Lägg ditt tips'}
    </BigButton>
  )

  const generateButton = allIn ? (
    <BigButton variant="light" onClick={handleGenerate} disabled={isPending}>
      {isPending ? 'Genererar…' : 'Generera bongen'}
    </BigButton>
  ) : (
    <BigButton variant="muted" disabled>
      Väntar på {waitingFor} till
    </BigButton>
  )

  const actions = open ? (
    <>
      {myPickButton}
      {me.isHost && generateButton}
    </>
  ) : (
    <BigButton variant="light" onClick={goResult}>
      Visa bongen
    </BigButton>
  )

  const desktopTitle = !open
    ? 'Bongen är klar'
    : allIn
      ? 'Alla har tippat'
      : `${submittedCount} av ${participants.length} har tippat`

  const desktopBody = !open
    ? 'Bongen är genererad och omgången är låst. Kopiera bongen och lämna in den innan omgången stänger.'
    : allIn
      ? 'Garderingarna läggs på de matcher gänget är mest oense om. Resten får den populäraste utgången.'
      : 'Dela koden med resten av gänget. Så fort allas tips är inne kan du generera bongen.'

  return (
    <SessionShell summary={summary}>
      {/* Phone */}
      <div className="animate-fade-up flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="px-[22px] pt-1.5 pb-4">
          <Kicker className="mb-3">
            {drawLabelUpper(summary.eventType, summary.closesAt)}
          </Kicker>
          <CodeCard code={code} onCopy={copyCode} />
          <div className="text-fg-2 mt-[11px] flex justify-between text-sm">
            <span>
              {systemLine(summary.halvgarderingar, summary.helgarderingar)}
            </span>
            <span className="font-mono">{formatNumber(rows)} rader</span>
          </div>
        </div>

        <div className="scrollbar-none flex-1 overflow-y-auto px-[22px]">
          <div className="mb-[11px] flex items-baseline justify-between">
            <Kicker>Deltagare</Kicker>
            <span className="text-fg-3 font-mono text-[11px]">
              {submittedCount}/{participants.length} KLARA
            </span>
          </div>
          <div className="flex flex-col gap-2 pb-4">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                name={p.name}
                me={p.id === me.id}
                done={p.submitted}
              />
            ))}
          </div>
          {participants.length === 1 && (
            <div className="border-line-2 rounded-[14px] border border-dashed px-5 py-[26px] text-center">
              <div className="mb-1.5 text-base font-semibold">
                Ingen har gått med än
              </div>
              <div className="text-fg-3 text-sm leading-[1.45]">
                Skicka koden till gänget. De som hoppar in dyker upp här direkt.
              </div>
            </div>
          )}
          <ErrorText>{error}</ErrorText>
        </div>

        <ScreenFooter className="pb-6">
          {actions}
          {open && (
            <TextButton danger onClick={end.onClick} disabled={end.pending}>
              {end.label}
            </TextButton>
          )}
        </ScreenFooter>
      </div>

      {/* Desktop */}
      <div className="animate-fade-up hidden flex-1 flex-col justify-center gap-[26px] px-16 lg:flex">
        <Kicker>{drawLabelUpper(summary.eventType, summary.closesAt)}</Kicker>
        <h2 className="text-[44px] leading-[1.1] font-bold tracking-[-0.02em] text-pretty">
          {desktopTitle}
        </h2>
        <p className="text-fg-2 max-w-[440px] text-[17px] leading-normal text-pretty">
          {desktopBody}
        </p>
        <div className="grid w-full max-w-[440px] grid-cols-2 gap-3">
          {actions}
        </div>
        <ErrorText>{error}</ErrorText>
      </div>
    </SessionShell>
  )
}
