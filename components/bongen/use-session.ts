'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './toast'
import type { SessionSummary } from '@/lib/session-summary'

const POLL_INTERVAL_MS = 3000

/** Re-fetch server data on an interval while the session is still open. */
export function usePollRefresh(enabled: boolean) {
  const router = useRouter()
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => router.refresh(), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [enabled, router])
}

export function useCopyCode(code: string) {
  const flash = useToast()
  return useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      flash('Koden kopierad')
    } catch {
      flash('Kunde inte kopiera')
    }
  }, [code, flash])
}

/**
 * "Avbryt omgången" (host) / "Lämna omgången" (guest).
 * Both are destructive, so the first tap arms a confirmation for 3 s.
 */
export function useEndSession(summary: SessionSummary) {
  const router = useRouter()
  const flash = useToast()
  const [armed, setArmed] = useState(false)
  const [pending, setPending] = useState(false)
  const isHost = summary.me.isHost

  useEffect(() => {
    if (!armed) return
    const id = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(id)
  }, [armed])

  const label = armed
    ? isHost
      ? 'TRYCK IGEN FÖR ATT AVBRYTA'
      : 'TRYCK IGEN FÖR ATT LÄMNA'
    : isHost
      ? 'AVBRYT OMGÅNGEN'
      : 'LÄMNA OMGÅNGEN'

  const onClick = useCallback(async () => {
    if (pending) return
    if (!armed) {
      setArmed(true)
      return
    }
    setPending(true)
    const action = isHost ? 'cancel' : 'leave'
    try {
      const res = await fetch(`/api/sessions/${summary.code}/${action}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error()
      const kind = isHost ? 'cancelled' : 'left'
      router.push(`/ended?kind=${kind}&code=${summary.code}`)
    } catch {
      flash(
        isHost ? 'Kunde inte avbryta omgången' : 'Kunde inte lämna omgången'
      )
      setPending(false)
      setArmed(false)
    }
  }, [armed, pending, isHost, summary.code, router, flash])

  return { label, onClick, pending }
}
