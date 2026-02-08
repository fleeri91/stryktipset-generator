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

export function calculateCost(
  selections: { home: boolean; draw: boolean; away: boolean }[],
  betPerRow: number
): number {
  return calculateRows(selections) * betPerRow
}

/**
 * Merge all participants' selections with OR logic.
 * If anyone picked "1" for match 3, the combined bong has "1" for match 3.
 */
export function mergeSelections(
  allSelections: {
    matchIndex: number
    home: boolean
    draw: boolean
    away: boolean
  }[][]
): { matchIndex: number; home: boolean; draw: boolean; away: boolean }[] {
  const merged = new Map<
    number,
    { matchIndex: number; home: boolean; draw: boolean; away: boolean }
  >()

  for (const participantSelections of allSelections) {
    for (const s of participantSelections) {
      const existing = merged.get(s.matchIndex)
      if (existing) {
        existing.home = existing.home || s.home
        existing.draw = existing.draw || s.draw
        existing.away = existing.away || s.away
      } else {
        merged.set(s.matchIndex, { ...s })
      }
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.matchIndex - b.matchIndex)
}
