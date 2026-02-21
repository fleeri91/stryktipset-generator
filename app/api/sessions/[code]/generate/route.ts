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
      return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
    }

    const session = participant.session

    const allSubmitted = session.participants.every((p) => p.submitted)
    if (!allSubmitted) {
      return NextResponse.json(
        { error: 'Alla deltagare har inte skickat in sina bongar' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const halvgarderingar =
      typeof body.halvgarderingar === 'number' && body.halvgarderingar >= 0
        ? Math.round(body.halvgarderingar)
        : 0
    const helgarderingar =
      typeof body.helgarderingar === 'number' && body.helgarderingar >= 0
        ? Math.round(body.helgarderingar)
        : 0

    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'GENERATED', halvgarderingar, helgarderingar },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to generate bong:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera bongen' },
      { status: 500 }
    )
  }
}
