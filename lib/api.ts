import { EventType, type EventRoot, type Event } from '@/types/SvenskaSpel'

const BASE_URL = process.env.SVENSKA_SPEL_BASE_URL!
const SECRET = process.env.SVENSKA_SPEL_SECRET!

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
  matches: MatchFromApi[]
}

export async function fetchDraw(
  eventType: EventType = EventType.Europatipset
): Promise<DrawInfo> {
  const url = `${BASE_URL}${eventType}/draws?accesskey=${SECRET}`

  const res = await fetch(url, { next: { revalidate: 300 } }) // cache 5 min
  if (!res.ok) {
    throw new Error(`Svenska Spel API error: ${res.status} ${res.statusText}`)
  }

  const data: EventRoot = await res.json()
  const draw = data.draws[0]

  if (!draw) {
    throw new Error('No active draw found')
  }

  const matches: MatchFromApi[] = draw.events
    .filter((e) => !e.cancelled)
    .map((e) => ({
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
    matches,
  }
}

function getParticipantName(event: Event, type: string): string {
  return (
    event.participants.find((p) => p.type === type)?.name ??
    event.description.split(' - ')[type === 'home' ? 0 : 1] ??
    'Okänd'
  )
}
