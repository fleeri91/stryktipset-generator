import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getParticipant } from '@/lib/auth'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const result = await getParticipant(code)
    if (result instanceof NextResponse) return result
    const participant = result

    const cookieStore = await cookies()

    if (!participant.isHost) {
      await prisma.participant.delete({ where: { id: participant.id } })
      cookieStore.delete('participant-token')
      return NextResponse.json({ success: true })
    }

    // Participant is the host — check for other participants
    const others = await prisma.participant.findMany({
      where: {
        sessionId: participant.session.id,
        id: { not: participant.id },
      },
    })

    if (others.length === 0) {
      // Last person: delete the whole session (cascade clears everything)
      await prisma.session.delete({ where: { id: participant.session.id } })
      cookieStore.delete('participant-token')
      return NextResponse.json({ success: true })
    }

    // Promote another participant to host, then remove the leaving host
    await prisma.$transaction([
      prisma.participant.update({
        where: { id: others[0].id },
        data: { isHost: true },
      }),
      prisma.participant.delete({ where: { id: participant.id } }),
    ])

    cookieStore.delete('participant-token')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to leave session:', error)
    return NextResponse.json(
      { error: 'Failed to leave session' },
      { status: 500 }
    )
  }
}
