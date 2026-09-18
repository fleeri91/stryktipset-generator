import type { Participant, Session } from '../generated/prisma/client'

export interface ParticipantSummary {
  id: string
  name: string
  isHost: boolean
  submitted: boolean
}

/** Serializable session snapshot shared by lobby, builder, result and sidebar. */
export interface SessionSummary {
  code: string
  status: 'BETTING' | 'GENERATED'
  eventType: string
  drawNumber: number
  closesAt: string
  halvgarderingar: number
  helgarderingar: number
  participants: ParticipantSummary[]
  me: ParticipantSummary
}

type ParticipantLike = Pick<Participant, 'id' | 'name' | 'isHost' | 'submitted'>

export function toSessionSummary(
  session: Session & { participants: ParticipantLike[] },
  me: ParticipantLike
): SessionSummary {
  const toSummary = (p: ParticipantLike): ParticipantSummary => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    submitted: p.submitted,
  })

  // Current participant first, then the rest in join order
  const others = session.participants.filter((p) => p.id !== me.id)

  return {
    code: session.code,
    status: session.status,
    eventType: session.eventType,
    drawNumber: session.drawNumber,
    closesAt: session.closesAt.toISOString(),
    halvgarderingar: session.halvgarderingar ?? 0,
    helgarderingar: session.helgarderingar ?? 0,
    participants: [toSummary(me), ...others.map(toSummary)],
    me: toSummary(me),
  }
}
