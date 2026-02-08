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
      return NextResponse.json({ error: 'Ogiltigt namn' }, { status: 400 })
    }

    const { name } = result.data

    const session = await prisma.session.findUnique({
      where: { code: code.toUpperCase() },
      include: { participants: true },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sessionen hittades inte' },
        { status: 404 }
      )
    }

    if (session.status === 'GENERATED') {
      return NextResponse.json(
        { error: 'Sessionen är redan låst' },
        { status: 403 }
      )
    }

    if (session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Sessionen har gått ut' },
        { status: 410 }
      )
    }

    const nameTaken = session.participants.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    )
    if (nameTaken) {
      return NextResponse.json(
        { error: 'Namnet är redan taget i denna session' },
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
      { error: 'Kunde inte gå med i sessionen' },
      { status: 500 }
    )
  }
}
