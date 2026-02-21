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

    if (!participant.isHost) {
      return NextResponse.json({ error: 'Ej behörig' }, { status: 403 })
    }

    // Delete the session — cascade removes all participants, matches, and selections
    await prisma.session.delete({ where: { id: participant.session.id } })

    const cookieStore = await cookies()
    cookieStore.delete('participant-token')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to cancel session:', error)
    return NextResponse.json(
      { error: 'Kunde inte avbryta sessionen' },
      { status: 500 }
    )
  }
}
