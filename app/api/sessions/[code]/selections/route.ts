import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { submitSelectionsSchema } from '@/lib/validations'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
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

    if (participant.session.status === 'GENERATED') {
      return NextResponse.json(
        { error: 'Sessionen är redan låst' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = submitSelectionsSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Ogiltig data', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { selections } = result.data

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
