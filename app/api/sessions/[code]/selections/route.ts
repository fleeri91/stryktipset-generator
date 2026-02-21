import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { submitSelectionsSchema } from '@/lib/validations'
import { getParticipant } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const result = await getParticipant(code)
    if (result instanceof NextResponse) return result
    const participant = result

    if (participant.session.status === 'GENERATED') {
      return NextResponse.json(
        { error: 'Sessionen är redan låst' },
        { status: 403 }
      )
    }

    if (participant.session.closesAt < new Date()) {
      return NextResponse.json(
        { error: 'Sessionen har gått ut' },
        { status: 410 }
      )
    }

    const body = await request.json()
    const validation = submitSelectionsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ogiltig data', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { selections } = validation.data

    // Upsert all selections and mark as submitted in a transaction
    await prisma.$transaction([
      // Delete existing selections (simpler than individual upserts)
      prisma.selection.deleteMany({
        where: { participantId: participant.id },
      }),
      // Create new selections
      prisma.selection.createMany({
        data: selections.map((s) => ({
          participantId: participant.id,
          matchIndex: s.matchIndex,
          home: s.home,
          draw: s.draw,
          away: s.away,
        })),
      }),
      // Mark participant as submitted
      prisma.participant.update({
        where: { id: participant.id },
        data: { submitted: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to submit selections:', error)
    return NextResponse.json(
      { error: 'Kunde inte spara bongen' },
      { status: 500 }
    )
  }
}
