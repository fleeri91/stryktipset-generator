import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantWithSessionParticipants } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const result = await getParticipantWithSessionParticipants(code)
    if (result instanceof NextResponse) return result
    const participant = result

    if (!participant.isHost) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const session = participant.session

    const allSubmitted = session.participants.every((p) => p.submitted)
    if (!allSubmitted) {
      return NextResponse.json(
        { error: 'Not all participants have submitted their picks' },
        { status: 400 }
      )
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'GENERATED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to generate bong:', error)
    return NextResponse.json(
      { error: 'Failed to generate combined bet' },
      { status: 500 }
    )
  }
}
