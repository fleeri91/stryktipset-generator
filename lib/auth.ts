import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { Participant, Session } from '../generated/prisma/client'

export type ParticipantWithSession = Participant & { session: Session }

export type ParticipantWithSessionAndParticipants = Participant & {
  session: Session & { participants: Participant[] }
}

/**
 * Validates the participant-token cookie and verifies the participant
 * belongs to the session identified by `code`.
 *
 * Returns a NextResponse error on failure, or the participant record on success.
 */
export async function getParticipant(
  code: string
): Promise<NextResponse | ParticipantWithSession> {
  const cookieStore = await cookies()
  const token = cookieStore.get('participant-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { session: true },
  })

  if (!participant || participant.session.code !== code.toUpperCase()) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  return participant
}

/**
 * Same as getParticipant but also includes session.participants.
 * Use this when you need to inspect other participants in the session
 * (e.g. checking allSubmitted in the generate route).
 */
export async function getParticipantWithSessionParticipants(
  code: string
): Promise<NextResponse | ParticipantWithSessionAndParticipants> {
  const cookieStore = await cookies()
  const token = cookieStore.get('participant-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Ej autentiserad' }, { status: 401 })
  }

  const participant = await prisma.participant.findUnique({
    where: { token },
    include: { session: { include: { participants: true } } },
  })

  if (!participant || participant.session.code !== code.toUpperCase()) {
    return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
  }

  return participant
}
