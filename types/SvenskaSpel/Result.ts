export interface ResultRoot {
  result: Result
  error: string | null
  requestInfo: RequestInfo
  requestId: string
  sessionId: string | null
  deviceId: string
  session: string | null
  sessionUser: string | null
  clientInfo: string | null
}

export interface Result {
  cancelled: boolean
  events: Event[]
  distribution: Distribution[]
  sport: Sport
  productName: string
  productId: number
  drawNumber: number
  currentNetSale: string
  regCloseTime: string
}

export interface Event {
  eventNumber: number
  eventComment: string
  eventDescription: string
  cancelled: boolean
  outcome: string
  outcomeDescription: string
  outcomeScore: OutcomeScore
  matchId: number
  participantType: string
  participants: Participant[]
}

export interface OutcomeScore {
  home: number
  away: number
}

export interface Participant {
  id: number
  type: string
  name: string
  shortName: string
  mediumName: string
  countryId: number
  countryName: string
  isoCode: string
}

export interface Distribution {
  winDiv: number
  winSet: number
  winners: number
  amount: string
  name: string
}

export interface Sport {
  id: number
  type: number
  name: string
}

export interface RequestInfo {
  elapsedTime: number
  apiVersion: number
}
