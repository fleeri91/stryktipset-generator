export interface EventRoot {
  draws: Draw[]
  error: unknown
  requestInfo: RequestInfo
  requestId: string
  sessionId: unknown
  deviceId: string
  session: unknown
  sessionUser: unknown
  clientInfo: unknown
}

export interface Draw {
  drawComment: string
  extraInfo: unknown
  drawState: string
  fund: unknown
  lastDateWithoutTimeOfDay: string
  events: Event[]
  jackpotItems: JackpotItem[]
  productName: string
  productId: number
  drawNumber: number
  openTime: string
  closeTime: string
  turnover: string
  sport: string
  sportId: number
  checksum: string
}

export interface Event {
  eventNumber: number
  description: string
  cancelled: boolean
  extraInfo: unknown
  eventTypeDescription: string
  participantType: string
  outcomes: unknown
  odds: Odds
  distribution: Distribution
  newspaperAdvice: unknown
  league: League
  participants: Participant[]
  sportEventId: number
  sportEventStart: string
  sportEventStatus: string
  favouriteOdds: FavouriteOdds
  startOdds: StartOdds
  randomResultProbability: RandomResultProbability
  complementaryOdds: unknown
  complementaryFavouriteOdds: unknown
  providerIds: ProviderId[]
}

export interface Odds {
  home: string
  draw: string
  away: string
}

export interface Distribution {
  date: string
  refDate: string
  home: string
  draw: string
  away: string
  refHome: string
  refDraw: string
  refAway: string
}

export interface League {
  id: number
  name: string
  season: Season
  country: Country
}

export interface Season {
  id: number
  name: string
}

export interface Country {
  id: number
  name: string
}

export interface Participant {
  id: number
  type: string
  name: string
}

export interface FavouriteOdds {
  home: string
  draw: string
  away: string
}

export interface StartOdds {
  home: string
  draw: string
  away: string
}

export interface RandomResultProbability {
  home: string
  draw: string
  away: string
}

export interface ProviderId {
  provider: string
  type: string
  id: string
}

export interface JackpotItem {
  description: string
  amount: string
}

export interface RequestInfo {
  elapsedTime: number
  apiVersion: number
}
