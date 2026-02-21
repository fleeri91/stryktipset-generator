import { EventType, type EventRoot, type Event } from '@/types/SvenskaSpel'
import { env } from '@/lib/env'

const BASE_URL = env.SVENSKA_SPEL_BASE_URL
const SECRET = env.SVENSKA_SPEL_SECRET

export interface MatchFromApi {
  eventNumber: number
  homeTeam: string
  awayTeam: string
  league: string
  kickoff: string
  odds: { home: string; draw: string; away: string }
  distribution: { home: string; draw: string; away: string }
}

export interface DrawInfo {
  drawNumber: number
  drawComment: string
  closeTime: string
  jackpot: string | null
  eventType: EventType
  productName: string
  matches: MatchFromApi[]
}

export async function fetchDraw(eventType: EventType): Promise<DrawInfo> {
  const url = `${BASE_URL}${eventType}/draws?accesskey=${SECRET}`

  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) {
    throw new Error(`Svenska Spel API error: ${res.status} ${res.statusText}`)
  }

  const data: EventRoot = await res.json()
  const draw = data.draws[0]

  if (!draw) {
    throw new Error(`No active draw found for ${eventType}`)
  }

  const matches: MatchFromApi[] = draw.events
    .filter((e: Event) => !e.cancelled)
    .map((e: Event) => ({
      eventNumber: e.eventNumber,
      homeTeam: getParticipantName(e, 'home'),
      awayTeam: getParticipantName(e, 'away'),
      league: e.league.name,
      kickoff: e.sportEventStart,
      odds: e.odds,
      distribution: e.distribution,
    }))

  const jackpot = draw.jackpotItems?.[0]?.amount ?? null

  return {
    drawNumber: draw.drawNumber,
    drawComment: draw.drawComment,
    closeTime: draw.closeTime,
    jackpot,
    eventType,
    productName: draw.productName,
    matches,
  }
}

export async function fetchAllDraws(): Promise<DrawInfo[]> {
  const results = await Promise.allSettled([
    fetchDraw(EventType.Stryktipset),
    fetchDraw(EventType.Europatipset),
  ])

  return results
    .filter(
      (r): r is PromiseFulfilledResult<DrawInfo> => r.status === 'fulfilled'
    )
    .map((r) => r.value)
}

function getParticipantName(event: Event, type: string): string {
  return (
    event.participants.find((p) => p.type === type)?.name ??
    event.description.split(' - ')[type === 'home' ? 0 : 1] ??
    'Okänd'
  )
}
