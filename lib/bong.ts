import { randomInt } from 'crypto'

/**
 * Generate a 6-character alphanumeric session code.
 * Excludes ambiguous characters (0/O, 1/I/L).
 * Uses crypto.randomInt for cryptographically-safe uniform distribution.
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[randomInt(chars.length)]
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

type CombinedPick = { matchIndex: number; home: boolean; draw: boolean; away: boolean }
export type PrimaryCountsMap = Record<number, { home: number; draw: number; away: number }>

type Selection = {
  matchIndex: number
  home: boolean
  draw: boolean
  away: boolean
  firstChoice: string | null
}

/**
 * Count each participant's primary vote per match per outcome.
 * Rows without firstChoice (legacy data) treat all selected outcomes as primary.
 */
export function buildPrimaryCounts(
  allSelections: Selection[][],
  matchIndices: number[]
): PrimaryCountsMap {
  const counts: PrimaryCountsMap = {}
  for (const idx of matchIndices) {
    counts[idx] = { home: 0, draw: 0, away: 0 }
  }
  for (const participantSelections of allSelections) {
    for (const s of participantSelections) {
      const entry = counts[s.matchIndex]
      if (!entry) continue
      const fc = s.firstChoice
      if (fc === 'home' || fc === 'draw' || fc === 'away') {
        entry[fc]++
      } else {
        if (s.home) entry.home++
        if (s.draw) entry.draw++
        if (s.away) entry.away++
      }
    }
  }
  return counts
}

/**
 * Trim a combined bong to fit within a max-rows budget.
 *
 * Uses a greedy strategy: repeatedly removes the pick with the fewest primary
 * supporters from the match with the most selected outcomes, until rows ≤ maxRows.
 * Single-pick matches are never trimmed (removing them would leave a match empty).
 */
export function trimToMaxRows(
  combined: CombinedPick[],
  maxRows: number,
  primaryCounts: PrimaryCountsMap
): CombinedPick[] {
  const result = combined.map((p) => ({ ...p }))

  while (calculateRows(result) > maxRows) {
    const removable: {
      matchIndex: number
      key: 'home' | 'draw' | 'away'
      primaryCount: number
      matchPickCount: number
    }[] = []

    for (const pick of result) {
      const selected = (['home', 'draw', 'away'] as const).filter((k) => pick[k])
      if (selected.length <= 1) continue // never empty a match

      for (const key of selected) {
        removable.push({
          matchIndex: pick.matchIndex,
          key,
          primaryCount: primaryCounts[pick.matchIndex]?.[key] ?? 0,
          matchPickCount: selected.length,
        })
      }
    }

    if (removable.length === 0) break // cannot trim further

    // Remove least-supported pick first; break ties by preferring the match
    // with more picks (higher multiplier contributes most to row count)
    removable.sort((a, b) =>
      a.primaryCount !== b.primaryCount
        ? a.primaryCount - b.primaryCount
        : b.matchPickCount - a.matchPickCount
    )

    const target = removable[0]
    const match = result.find((p) => p.matchIndex === target.matchIndex)
    if (match) match[target.key] = false
  }

  return result
}

/**
 * Generate a combined system bong with a given number of halvgarderingar
 * (2-outcome matches) and helgarderingar (3-outcome matches).
 *
 * Matches are ranked by "contentiousness" — how many participants picked
 * a different outcome as their primary. The most contested matches get
 * helgarderingar first, then halvgarderingar, then single picks.
 *
 * Within each category the most popular primary pick is always included.
 */
export function generateSystemBong(
  allSelections: Selection[][],
  matchIndices: number[],
  halvgarderingar: number,
  helgarderingar: number
): { matchIndex: number; home: boolean; draw: boolean; away: boolean }[] {
  const primaryVotes = buildPrimaryCounts(allSelections, matchIndices)

  // For each match, sort outcomes by vote count (descending)
  const matchData = matchIndices.map((matchIndex) => {
    const votes = primaryVotes[matchIndex]
    const sorted = (['home', 'draw', 'away'] as const)
      .map((k) => ({ key: k, votes: votes[k] }))
      .sort((a, b) => b.votes - a.votes)
    return { matchIndex, sorted }
  })

  // Rank matches by contentiousness:
  // primary key = second-highest vote count (halvgardering potential)
  // secondary key = third-highest vote count (helgardering potential)
  const ranked = [...matchData].sort((a, b) => {
    const diff = b.sorted[1].votes - a.sorted[1].votes
    if (diff !== 0) return diff
    return b.sorted[2].votes - a.sorted[2].votes
  })

  const helSet = new Set(ranked.slice(0, helgarderingar).map((m) => m.matchIndex))
  const halvSet = new Set(
    ranked.slice(helgarderingar, helgarderingar + halvgarderingar).map((m) => m.matchIndex)
  )

  return matchData.map(({ matchIndex, sorted }) => {
    if (helSet.has(matchIndex)) {
      return { matchIndex, home: true, draw: true, away: true }
    }
    if (halvSet.has(matchIndex)) {
      const result = { matchIndex, home: false, draw: false, away: false }
      sorted.slice(0, 2).forEach(({ key }) => { result[key] = true })
      return result
    }
    // Single pick: most popular primary; default to 'home' when all votes are zero
    const result = { matchIndex, home: false, draw: false, away: false }
    result[sorted[0]?.key ?? 'home'] = true
    return result
  })
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
  allSelections: Selection[][]
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
