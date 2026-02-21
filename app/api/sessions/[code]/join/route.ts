import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { joinSessionSchema } from '@/lib/validations'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()

    const result = joinSessionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    const { name } = result.data

    const session = await prisma.session.findUnique({
      where: { code: code.toUpperCase() },
      include: { participants: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'GENERATED') {
      return NextResponse.json(
        { error: 'Session is locked' },
        { status: 403 }
      )
    }

    if (session.closesAt < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 410 }
      )
    }

    const nameTaken = session.participants.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    )
    if (nameTaken) {
      return NextResponse.json(
        { error: 'Name is already taken in this session' },
        { status: 409 }
      )
    }

    const participant = await prisma.participant.create({
      data: {
        sessionId: session.id,
        name,
        isHost: false,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set('participant-token', participant.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ sessionCode: session.code }, { status: 201 })
  } catch (error) {
    console.error('Failed to join session:', error)
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    )
  }
}
