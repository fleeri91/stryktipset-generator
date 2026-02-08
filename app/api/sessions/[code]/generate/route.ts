import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
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
      include: { session: { include: { participants: true } } },
    })

    if (!participant || participant.session.code !== code.toUpperCase()) {
      return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
    }

    const session = participant.session

    if (session.status === 'GENERATED') {
      return NextResponse.json(
        { error: 'Bongen är redan genererad' },
        { status: 409 }
      )
    }

    const allSubmitted = session.participants.every((p) => p.submitted)
    if (!allSubmitted) {
      return NextResponse.json(
        { error: 'Alla deltagare har inte skickat in sina bongar' },
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
      { error: 'Kunde inte generera bongen' },
      { status: 500 }
    )
  }
}
