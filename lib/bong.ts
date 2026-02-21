/**
 * Generate a 6-character alphanumeric session code.
 * Excludes ambiguous characters (0/O, 1/I/L).
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function calculateRows(
  selections: { home: boolean; draw: boolean; away: boolean }[]
): number {
  return selections.reduce((rows, s) => {
    const picks = [s.home, s.draw, s.away].filter(Boolean).length
    return rows * (picks || 1)
  }, 1)
}

/**
 * Merge all participants' selections using primary-pick logic.
 *
 * An outcome is included in the combined bong only if at least one participant
 * chose it as their primary (first) pick. A secondary pick is included only if
 * another participant independently chose that same outcome as their primary pick.
 *
 * Legacy rows without firstChoice are treated as having all selected outcomes
 * as primary picks (backward-compatible OR behaviour).
 */
export function mergeSelections(
  allSelections: {
    matchIndex: number
    home: boolean
    draw: boolean
    away: boolean
    firstChoice: string | null
  }[][]
): { matchIndex: number; home: boolean; draw: boolean; away: boolean }[] {
  const merged = new Map<
    number,
    { matchIndex: number; home: boolean; draw: boolean; away: boolean }
  >()

  for (const participantSelections of allSelections) {
    for (const s of participantSelections) {
      const entry = merged.get(s.matchIndex) ?? {
        matchIndex: s.matchIndex,
        home: false,
        draw: false,
        away: false,
      }
      // firstChoice === null means legacy data — treat all selected outcomes as primary
      const fc = s.firstChoice
      if (s.home && (fc === 'home' || fc === null)) entry.home = true
      if (s.draw && (fc === 'draw' || fc === null)) entry.draw = true
      if (s.away && (fc === 'away' || fc === null)) entry.away = true
      merged.set(s.matchIndex, entry)
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.matchIndex - b.matchIndex)
}
