'use client'

import type { ReactNode } from 'react'
import { drawLabel, systemLine } from '@/lib/session-labels'
import type { SessionSummary } from '@/lib/session-summary'
import { CodeCard, Kicker, ParticipantRow, TextButton, Wordmark } from './ui'
import { useCopyCode, useEndSession } from './use-session'

/**
 * Full-height app frame. On desktop (lg+) a sidebar with the code,
 * draw and participants sits to the left of the screen content.
 */
export function SessionShell({
  summary,
  children,
}: {
  summary: SessionSummary
  children: ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col lg:flex-row">
      <SessionSidebar summary={summary} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

function SessionSidebar({ summary }: { summary: SessionSummary }) {
  const copyCode = useCopyCode(summary.code)
  const end = useEndSession(summary)
  const submitted = summary.participants.filter((p) => p.submitted).length

  return (
    <aside className="bg-ink-2 border-line hidden w-[296px] shrink-0 flex-col border-r px-[22px] pt-[26px] pb-[22px] lg:flex">
      <Wordmark className="mb-[22px]" />
      <div className="mb-3">
        <CodeCard code={summary.code} onCopy={copyCode} compact />
      </div>
      <div className="text-fg-3 border-line flex justify-between border-b px-0.5 pb-[18px] text-[13px]">
        <span>{drawLabel(summary.eventType, summary.closesAt)}</span>
        <span className="font-mono">
          {systemLine(summary.halvgarderingar, summary.helgarderingar)}
        </span>
      </div>
      <div className="flex items-baseline justify-between px-0.5 pt-[18px] pb-[11px]">
        <Kicker>Deltagare</Kicker>
        <span className="text-fg-3 font-mono text-[11px]">
          {submitted}/{summary.participants.length}
        </span>
      </div>
      <div className="scrollbar-none flex min-h-0 flex-1 flex-col gap-[7px] overflow-y-auto">
        {summary.participants.map((p) => (
          <ParticipantRow
            key={p.id}
            name={p.name}
            me={p.id === summary.me.id}
            done={p.submitted}
            compact
          />
        ))}
      </div>
      {summary.status === 'BETTING' && (
        <TextButton
          danger
          className="mt-4 px-0.5 text-left"
          onClick={end.onClick}
          disabled={end.pending}
        >
          {end.label}
        </TextButton>
      )}
    </aside>
  )
}
