export interface ResultsHistoryRoot {
  product: string
  live: boolean
  year: number
  month: number
  resultDates: ResultDate[]
  error: string | null
  requestInfo: RequestInfo
  requestId: string
  sessionId: string | null
  deviceId: string
  session: string | null
  sessionUser: string | null
  clientInfo: string | null
}

export interface ResultDate {
  date: string
  openDate: string | null
  closeDate: string
  product: string
  drawNumber: number
  drawState: DrawState
  drawStateId: number
}

export enum DrawState {
  Finalized = 'Finalized',
  Open = 'Open',
}

export interface RequestInfo {
  elapsedTime: number
  apiVersion: number
}
